import SwiftUI
import UserNotifications
import WidgetKit

/// アプリ（src/widget/index.tsx）と共有する場所。地点と、アプリが計算した次に曇る時刻が入る
let appGroup = "group.com.skart.cloudingwithyou"

/// アプリが書く中身。kind は start（未同意）/ no-point / point
struct Shared: Decodable {
  let kind: String
  let name: String?
  let lat: Double?
  let lon: Double?
  let nextOnset: Double?
}

func readShared() -> Shared {
  guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "widget"),
    let data = raw.data(using: .utf8),
    let s = try? JSONDecoder().decode(Shared.self, from: data)
  else { return Shared(kind: "start", name: nil, lat: nil, lon: nil, nextOnset: nil) }
  return s
}

/// 判定は src/domain/cloudPlan.ts と同じ。雲量 30% 以下（晴れ）から 70% 以上（曇り）に変わる時刻
enum Clouds {
  static let clearMax = 30.0
  static let cloudyMin = 70.0
  static let lead: TimeInterval = 60 * 60
  static let horizon: TimeInterval = 48 * 60 * 60
  static let staleAfter: TimeInterval = 48 * 60 * 60

  static func coarse(_ v: Double) -> Double { (v * 100).rounded() / 100 }

  /// MET Norway から予報を取り、次に曇る時刻を返す。取れなければ nil、曇りの予報が無ければ .some(nil)
  static func fetchNextOnset(lat: Double, lon: Double) async -> Date?? {
    var comps = URLComponents(string: "https://api.met.no/weatherapi/locationforecast/2.0/compact")!
    comps.queryItems = [
      URLQueryItem(name: "lat", value: String(coarse(lat))), URLQueryItem(name: "lon", value: String(coarse(lon))),
    ]
    var req = URLRequest(url: comps.url!, timeoutInterval: 15)
    req.setValue("clouding-with-you/2.0 (https://skart-inc.jimdofree.com/)", forHTTPHeaderField: "User-Agent")
    guard let (data, res) = try? await URLSession.shared.data(for: req),
      (res as? HTTPURLResponse)?.statusCode == 200,
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let props = json["properties"] as? [String: Any],
      let series = props["timeseries"] as? [[String: Any]]
    else { return nil }
    let iso = ISO8601DateFormatter()
    let now = Date()
    var clear = false
    for s in series {
      guard let t = (s["time"] as? String).flatMap(iso.date(from:)),
        let d = ((s["data"] as? [String: Any])?["instant"] as? [String: Any])?["details"] as? [String: Any],
        let c = d["cloud_area_fraction"] as? Double
      else { continue }
      if t.timeIntervalSince(now) > horizon { break }
      if c <= clearMax {
        clear = true
      } else if c >= cloudyMin && clear {
        clear = false
        if t > now { return .some(t) }
      }
    }
    return .some(nil)
  }

  /// アプリと同じ ID で予約する（同じ曇りなら上書きになり、二重に鳴らない）。鳴らす時刻を過ぎていたら予約しない
  static func schedule(name: String, onset: Date?) {
    let center = UNUserNotificationCenter.current()
    if let onset = onset {
      let fire = onset.addingTimeInterval(-lead)
      if fire.timeIntervalSinceNow > 60 {
        let c = UNMutableNotificationContent()
        c.title = "\(name)の上空"
        c.body = "ねぇ、今から曇るよ"
        c.sound = UNNotificationSound(named: UNNotificationSoundName("notification_sound.wav"))
        c.userInfo = ["url": "/cloudy", "name": name]
        let trigger = UNCalendarNotificationTrigger(
          dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: fire),
          repeats: false)
        let id = "cloud-\(Int64(onset.timeIntervalSince1970 * 1000))"
        center.add(UNNotificationRequest(identifier: id, content: c, trigger: trigger))
      }
    }
    // 取り直せたので、声かけ通知を先へずらす
    let s = UNMutableNotificationContent()
    s.title = "しばらく空を見上げていません"
    s.body = "開くと、また曇りをお知らせします。"
    s.userInfo = ["url": "/"]
    let staleTrigger = UNTimeIntervalNotificationTrigger(timeInterval: staleAfter, repeats: false)
    center.add(UNNotificationRequest(identifier: "stale", content: s, trigger: staleTrigger))
  }
}

struct CloudEntry: TimelineEntry {
  let date: Date
  let kind: String
  let name: String
  let nextOnset: Date?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> CloudEntry {
    CloudEntry(date: Date(), kind: "point", name: "東京", nextOnset: Date().addingTimeInterval(3 * 3600))
  }

  func getSnapshot(in context: Context, completion: @escaping (CloudEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : entry(from: readShared(), onset: nil))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CloudEntry>) -> Void) {
    let shared = readShared()
    let next = Date().addingTimeInterval(30 * 60)
    guard shared.kind == "point", let lat = shared.lat, let lon = shared.lon else {
      completion(Timeline(entries: [entry(from: shared, onset: nil)], policy: .after(next)))
      return
    }
    Task {
      let fetched = await Clouds.fetchNextOnset(lat: lat, lon: lon)
      if let onset = fetched { Clouds.schedule(name: shared.name ?? "", onset: onset) }
      // 取れなければアプリが計算した時刻を使う
      let onset: Date? = fetched ?? shared.nextOnset.map { Date(timeIntervalSince1970: $0 / 1000) }
      completion(Timeline(entries: [entry(from: shared, onset: onset)], policy: .after(next)))
    }
  }

  private func entry(from s: Shared, onset: Date?) -> CloudEntry {
    let o = onset ?? s.nextOnset.map { Date(timeIntervalSince1970: $0 / 1000) }
    return CloudEntry(date: Date(), kind: s.kind, name: s.name ?? "", nextOnset: o.flatMap { $0 > Date() ? $0 : nil })
  }
}

func whenText(_ d: Date) -> String {
  let cal = Calendar.current
  let f = DateFormatter()
  f.locale = Locale(identifier: "ja_JP")
  f.dateFormat = "H:mm"
  let day: String
  if cal.isDateInToday(d) {
    day = "今日"
  } else if cal.isDateInTomorrow(d) {
    day = "明日"
  } else {
    let m = DateFormatter()
    m.locale = Locale(identifier: "ja_JP")
    m.dateFormat = "M月d日"
    day = m.string(from: d)
  }
  return "\(day) \(f.string(from: d))ごろ"
}

struct NextCloudView: View {
  let entry: CloudEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    let top = entry.kind == "point" ? "\(entry.name)の上空" : "曇天気の娘"
    let main: String = {
      switch entry.kind {
      case "start": return "アプリを開いて始めてください"
      case "no-point": return "祈願する地点を登録してください"
      default: return entry.nextOnset.map(whenText) ?? "しばらく曇りの予報はありません"
      }
    }()
    let big = entry.kind == "point" && entry.nextOnset != nil
    HStack(alignment: .center) {
      VStack(alignment: .leading, spacing: 4) {
        Text(top).font(.custom("ShipporiMincho-Regular", size: 13)).foregroundStyle(.white.opacity(0.86)).lineLimit(1)
        if big {
          Text("次に曇りそうなのは").font(.custom("ShipporiMincho-Regular", size: 12)).foregroundStyle(.white)
        }
        Text(main)
          .font(.custom("ShipporiMincho-Bold", size: big ? (family == .systemSmall ? 18 : 22) : 14))
          .foregroundStyle(.white)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
      }
      Spacer(minLength: 0)
      if family != .systemSmall {
        Image("cloud").resizable().scaledToFit().frame(width: 84)
      }
    }
    .containerBackground(for: .widget) {
      LinearGradient(colors: [Color("skyTop"), Color("skyBottom")], startPoint: .top, endPoint: .bottom)
    }
  }
}

@main
struct NextCloudWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NextCloud", provider: Provider()) { entry in
      NextCloudView(entry: entry)
    }
    .configurationDisplayName("曇天気の娘")
    .description("次に曇りそうな時刻")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
