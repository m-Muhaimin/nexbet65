// Quick smoke test against both live game servers using Node's built-in WebSocket.
const aviator = new WebSocket("ws://localhost:8080");
const wheel = new WebSocket("ws://localhost:8090");

aviator.onmessage = (e) => {
  const d = JSON.parse(e.data);
  console.log("AVIATOR:", d.type, JSON.stringify(d).slice(0, 260));
  if (d.type === "welcome") {
    aviator.send(JSON.stringify({ type: "place_bet", amount: 10 }));
  }
  if (d.type === "bet_accepted") {
    console.log("AVIATOR bet accepted, balance:", d.balance);
  }
  if (d.type === "round_betting") {
    console.log("AVIATOR round_betting, hash:", (d.serverSeedHash || "").slice(0, 16));
    aviator.close();
    wheelCleanup();
  }
};

let wheelDone = false;
function wheelCleanup() {
  if (!wheelDone) { wheelDone = true; wheel.close(); process.exit(0); }
}
wheel.onmessage = (e) => {
  const d = JSON.parse(e.data);
  console.log("WHEEL:", d.type, JSON.stringify(d).slice(0, 300));
  if (d.type === "welcome") {
    console.log("WHEEL segments:", d.segments?.length, "phase:", d.phase);
    if (d.phase === "betting" && d.segments?.length) {
      wheel.send(JSON.stringify({ type: "place_bet", segmentId: "ONE", amount: 10 }));
    }
  }
  if (d.type === "bet_accepted") {
    console.log("WHEEL bet accepted on", d.segmentId, "balance:", d.balance);
  }
};

const to = setTimeout(() => { console.log("TIMEOUT"); process.exit(1); }, 15000);
aviator.onclose = () => console.log("aviator closed");
