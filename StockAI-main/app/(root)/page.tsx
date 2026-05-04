import TradingViewWidget from "@/components/TradingViewWidget";
import Chatbot from "@/components/chatbot";

import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from "@/lib/constants";

import { sendDailyNewsSummary } from "@/lib/inngest/functions";

const Home = () => {
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const stocks = [
    "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK-B",
    "JPM","V","MA","XOM","JNJ","PG","KO","PEP","AVGO","COST",
    "HD","ABBV","MRK","LLY","BAC","WMT","NFLX","CRM","ORCL",
    "CSCO","TMO","ACN"
  ];

  return (
    <div className="flex flex-col min-h-screen home-wrapper gap-8">

      {/* ===== TOP SECTION ===== */}
      <section className="grid w-full gap-8 home-section">
        <div className="md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Market Overview"
            scriptUrl={`${scriptUrl}market-overview.js`}
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            className="custom-chart"
            height={600}
          />
        </div>

        <div className="md-col-span xl:col-span-2">
          <TradingViewWidget
            title="Stock Heatmap"
            scriptUrl={`${scriptUrl}stock-heatmap.js`}
            config={HEATMAP_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>

      {/* ===== SECOND SECTION ===== */}
      <section className="grid w-full gap-8 home-section">
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}timeline.js`}
            config={TOP_STORIES_WIDGET_CONFIG}
            height={600}
          />
        </div>

        <div className="h-full md:col-span-1 xl:col-span-2">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}market-quotes.js`}
            config={MARKET_DATA_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>

      {/* ===== CHATBOT + STOCK LIST SECTION ===== */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-4">

        {/* LEFT — CHATBOT */}
        <div className="bg-zinc-900 rounded-2xl p-4 h-[500px] overflow-hidden">
          <Chatbot />
        </div>

        {/* RIGHT — STOCK LIST */}
        <div className="bg-zinc-900 rounded-2xl p-4 h-[500px] overflow-y-auto">
          <h2 className="text-white text-lg font-semibold mb-4">
            Top Stocks
          </h2>

          <ul className="space-y-2">
            {stocks.map((stock) => (
              <li
                key={stock}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition cursor-pointer"
              >
                {stock}
              </li>
            ))}
          </ul>
        </div>

      </section>

    </div>
  );
};

export default Home;