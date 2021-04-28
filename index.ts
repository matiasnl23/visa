import fs from "fs";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import dayjs from "dayjs";
import { ICard } from "./interfaces/card";
import { login } from "./helpers/login";
import {
  getAuthorizations,
  getCardList,
  getCardSummary,
  getLastMovements,
  selectCard,
} from "./helpers/card";
dotenv.config({ path: `${__dirname}/.env`.replace("dist/", "") });

(async () => {
  let cards: ICard[] = [];

  const browser = await puppeteer.launch({
    defaultViewport: { width: 1280, height: 768 },
  });
  const page = await browser.newPage();
  await page.goto((process.env.SITE_URL + "/login") as string);

  await login(page);
  cards = (await getCardList(page)).map((c) => ({
    ...c,
    summary: [],
    movements: [],
    authorizations: [],
  }));

  for (let i = 0; i < cards.length; i++) {
    await selectCard(page, i + 1);
    cards[i].summary = await getCardSummary(page);
    cards[i].movements = await getLastMovements(page);
    cards[i].authorizations = await getAuthorizations(page);
  }

  const fileName = `${__dirname}/visa-${dayjs().format(
    "YYYY-MM-DD"
  )}.json`.replace("dist/", "");

  fs.writeFileSync(fileName, JSON.stringify(cards, null, 2));

  await browser.close();
})();
