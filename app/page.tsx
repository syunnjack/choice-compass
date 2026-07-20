"use client";

import { useMemo, useState } from "react";

const samples = [
  { kind: "JAN", code: "4902430906264", name: "モバイルバッテリー 10000mAh", area: "千葉市美浜区", price: "¥3,480", status: "在庫あり", score: 82 },
  { kind: "ISBN", code: "9784295017840", name: "はじめてのAI仕事術", area: "新宿区", price: "¥1,980", status: "残りわずか", score: 68 },
  { kind: "車種", code: "6AA-ZVW60", name: "プリウス60系対応ドライブレコーダー", area: "横浜市港北区", price: "¥19,800", status: "取付予約可", score: 44 },
  { kind: "品番", code: "EH-NA0J", name: "高浸透ナノケア ドライヤー", area: "大阪市北区", price: "¥34,650", status: "在庫あり", score: 57 },
];

export default function Home() {
  const [area, setArea] = useState("");
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const results = useMemo(() => samples.filter((item) => (!area || item.area.includes(area)) && (!code || `${item.code}${item.name}`.toLowerCase().includes(code.toLowerCase()))), [area, code]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top"><span>Choice</span> Compass</a>
        <nav aria-label="メインナビゲーション"><a href="#search">商品を探す</a><a href="#how">仕組み</a><button onClick={() => setNotice("通知リストはこの端末に保存されます（デモ）。")}>通知リスト <b>2</b></button></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">地域の商品選びを、もっと確かに。</p>
          <h1>その商品、<br/><em>近くで買える。</em></h1>
          <p className="lead">市区町村とJAN・ISBN・車種・品番を組み合わせて、在庫・価格・混み具合をひとつの画面で比較します。</p>
          <div className="trust-row"><span>✓ 登録無料</span><span>✓ 投稿時刻を表示</span><span>✓ 広告を明記</span></div>
        </div>
        <div className="signal-card" aria-label="混雑状況サンプル">
          <div className="signal-head"><span>千葉市美浜区</span><strong>LIVE</strong></div>
          <h2>買いやすさ指数</h2><div className="score"><b>82</b><span>/100<br/>比較的すいています</span></div>
          <div className="bars">{[38,55,72,88,63,42,31].map((n,i)=><i key={i} style={{height:`${n}%`}} />)}</div>
          <p>利用者報告と店舗更新から算出・12分前更新</p>
        </div>
      </section>

      <section className="search-panel" id="search">
        <div><label htmlFor="area">市区町村・駅</label><input id="area" value={area} onChange={(e)=>setArea(e.target.value)} placeholder="例：新宿区、幕張駅" /></div>
        <div><label htmlFor="code">JAN・ISBN・車種・品番</label><input id="code" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="コードを入力または商品名で検索" /></div>
        <button className="primary" onClick={()=>setSearched(true)}>近くの商品を探す →</button>
      </section>

      <section className="results" aria-live="polite">
        <div className="section-title"><div><p className="eyebrow">DISCOVER</p><h2>{searched ? `${results.length}件の候補が見つかりました` : "いま注目の商品"}</h2></div><p>価格・在庫情報は更新日時を確認してから購入してください。</p></div>
        <div className="card-grid">
          {(searched ? results : samples).map((item) => <article className="product-card" key={item.code}>
            <div className="product-top"><span className="kind">{item.kind}</span><span className={`stock ${item.score < 50 ? "busy" : ""}`}>● {item.status}</span></div>
            <h3>{item.name}</h3><code>{item.code}</code><p className="area">⌖ {item.area}</p>
            <div className="product-bottom"><strong>{item.price}<small>〜</small></strong><button onClick={()=>setNotice(`${item.name}の在庫・値下げ通知を登録しました。`)}>通知する</button></div>
            <div className="meter"><span style={{width:`${item.score}%`}} /></div><small>買いやすさ {item.score}</small>
          </article>)}
        </div>
        {searched && results.length === 0 && <div className="empty">条件に一致するデモデータはありません。市区町村またはコードを短くしてお試しください。</div>}
      </section>

      <section className="how" id="how"><p className="eyebrow">HOW IT WORKS</p><h2>地域の「いま」を、みんなで育てる。</h2><div className="steps"><article><b>01</b><h3>商品を特定</h3><p>バーコード、ISBN、車種・型式、メーカー品番で取り違えを防止。</p></article><article><b>02</b><h3>地域情報を確認</h3><p>店舗更新、利用者投稿、公開時刻から在庫と混雑の信頼度を表示。</p></article><article><b>03</b><h3>通知して購入</h3><p>入荷・値下げ・混雑解消を受け取り、店舗または提携ECへ移動。</p></article></div></section>
      <footer><div className="brand"><span>Choice</span> Compass</div><p>掲載情報は参考情報です。購入前に販売店で最新状況をご確認ください。広告リンクを含む場合は「広告」と明記します。</p><nav><a href="#">運営情報</a><a href="#">プライバシー</a><a href="#">広告掲載方針</a></nav></footer>
      {notice && <div className="toast" role="status">{notice}<button aria-label="閉じる" onClick={()=>setNotice(null)}>×</button></div>}
    </main>
  );
}
