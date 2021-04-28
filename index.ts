import dotenv from "dotenv";
import { Visa } from "./lib/visa";
dotenv.config({ path: `${__dirname}/.env`.replace("dist/", "") });

(async () => {
  const visaScrapper = new Visa();
  await visaScrapper.collectData();
})();
