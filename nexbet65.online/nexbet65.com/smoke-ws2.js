const wheel = new WebSocket("ws://localhost:8090");
const to = setTimeout(() => { console.log("TIMEOUT"); process.exit(1); }, 15000);
wheel.onmessage = (e) => {
  const d = JSON.parse(e.data);
  console.log("WHEEL:", d.type, JSON.stringify(d).slice(0, 320));
  if (d.type === "welcome") {
    console.log("segments:", d.segments?.length, "phase:", d.phase, "balance:", d.balance);
    if (d.phase === "betting") {
      wheel.send(JSON.stringify({ type: "place_bet", segmentId: "TREASURE_HUNT", amount: 10 }));
      wheel.send(JSON.stringify({ type: "place_bet", segmentId: "ONE", amount: 10 }));
    }
  }
  if (d.type === "bet_accepted") console.log("accepted:", d.segmentId, "balance:", d.balance);
  if (d.type === "betting_open") {
    console.log("new round betting_open hash:", (d.serverSeedHash || "").slice(0, 16));
  }
  if (d.type === "round_result" || d.type === "wheel_landed") {
    clearTimeout(to);
    console.log("FULL ROUND OBSERVED");
    setTimeout(() => process.exit(0), 500);
  }
};
