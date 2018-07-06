const BasicClient = require("../basic-client");
const Trade = require("../trade");
const moment = require("moment");

class BitmexClient extends BasicClient {
  constructor() {
    super("wss://www.bitmex.com/realtime", "BitMEX");
  }

  _sendSubTrades(remote_id) {
    this._wss.send(
      JSON.stringify({
        op: "subscribe",
        args: [`trade:${remote_id}`],
      })
    );
  }

  _sendUnsubTrades(remote_id) {
    this._wss.send(
      JSON.stringify({
        op: "unsubscribe",
        args: [`trade:${remote_id}`],
      })
    );
  }

  _onMessage(msgs) {
    let message = JSON.parse(msgs);

    // ignore other messages
    if (message.action != "insert" && message.action != "partial") return;

    for (let datum of message.data) {
      let trade = this._constructTradesFromMessage(datum);
      this.emit("trade", trade);
    }
  }

  _constructTradesFromMessage(datum) {
    let { size, side, timestamp, price, trdMatchID } = datum;
    let market = this._tradeSubs.get(datum.symbol);

    size = side === "Sell" ? -parseFloat(size) : parseFloat(size);
    let priceNum = parseFloat(price);
    let unix = moment(timestamp).unix();

    return new Trade({
      exchange: "BitMEX",
      base: market.base,
      quote: market.quote,
      tradeId: trdMatchID.replace(/-/g, ""),
      unix,
      price: priceNum,
      amount: size,
    });
  }
}

module.exports = BitmexClient;
