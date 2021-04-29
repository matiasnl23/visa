import dotenv from "dotenv";
import { BBVA } from "./lib/bbva";
import { Visa } from "./lib/visa";
dotenv.config({ path: `${__dirname}/.env`.replace("dist/", "") });

(async () => {
  const visaScrapper = new Visa();
  const bbvaScrapper = new BBVA();
  visaScrapper.collectData();
  bbvaScrapper.collectData();
})();
