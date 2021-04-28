import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import puppeteer, { Page } from "puppeteer";
import {
  IAuthorization,
  ICard,
  ICardBase,
  IMovement,
  ISummaryDetail,
} from "../interfaces/card";

export class Visa {
  cards: ICard[] = [];

  constructor() {}

  async collectData(): Promise<void> {
    const browser = await puppeteer.launch({
      defaultViewport: { width: 1280, height: 768 },
    });
    const page = await browser.newPage();
    await page.goto((process.env.SITE_URL + "/login") as string);

    await this.login(page);
    this.cards = (await this.getCardList(page)).map((c) => ({
      ...c,
      summary: [],
      movements: [],
      authorizations: [],
    }));

    for (let i = 0; i < this.cards.length; i++) {
      await this.selectCard(page, i + 1);
      this.cards[i].summary = await this.getCardSummary(page);
      this.cards[i].movements = await this.getLastMovements(page);
      this.cards[i].authorizations = await this.getAuthorizations(page);
    }

    const filename = path
      .resolve(`${__dirname}`, `../visa-${dayjs().format("YYYY-MM-DD")}.json`)
      .replace("dist/", "");

    fs.writeFileSync(filename, JSON.stringify(this.cards, null, 2));
    await browser.close();
  }

  private async login(page: Page): Promise<void> {
    const numberInput = '[id="loginFrm:docNumber"]';
    const passwordInput = '[id="loginFrm:password"]';
    const confirmButton = '[id="loginFrm:button"]';

    const user = process.env.USER_NUMBER as string;
    const password = process.env.USER_PASSWORD as string;

    await page.waitForSelector(numberInput);
    await page.click(numberInput);
    await page.type(numberInput, user);
    await page.click(passwordInput);
    await page.type(passwordInput, password);
    await page.click(confirmButton);
  }

  private async selectCard(page: Page, position: number): Promise<void> {
    const cardSelect = "[id='cardsDropDown']";
    const cardList = "[id='cardContent']>ul";

    await page.waitForSelector(cardSelect);
    await page.click(cardSelect);
    await page.waitForSelector(cardList);
    await page.click(cardList + `>li:nth-of-type(${position})`);
    await page.waitForTimeout(1000);
  }

  private async getCardList(page: Page): Promise<ICardBase[]> {
    const cardSelect = "[id='cardsDropDown']";
    const cardList = "[id='cardContent']>ul";

    await page.waitForSelector(cardSelect);
    await page.click(cardSelect);
    await page.waitForSelector(cardList);

    return await page.$$eval(cardList + ">li", (ul) =>
      ul.map((li) => {
        const cardEntity = li
          .querySelector(".card-nombre-banco")
          ?.textContent?.split("-")[0];
        const cardOwner = li.querySelector(".card-apellido-nombre")
          ?.textContent;

        return {
          cardEntity: cardEntity?.trim() as string,
          cardOwner: cardOwner?.replace("\n", "").trim() as string,
          cardNumber: [...li.querySelectorAll(".card-numero-tarjeta>span")]
            .map((c) => c.textContent)
            .join("") as string,
          isAdditional: li.querySelector(".adicional") ? true : false,
        };
      })
    );
  }

  private async getCardSummary(page: Page): Promise<ISummaryDetail[]> {
    await page.click(".home-ico>a");

    const valueElements = "tr.odd,tr.even";

    await page.waitForTimeout(1000);
    await page.waitForSelector(valueElements);

    const summary = await page.$$eval(valueElements, (rows) =>
      rows.map((r) => {
        const description = r.querySelector(".item-description");

        return {
          description: (description && description.children.length > 1
            ? description?.querySelector("label")?.innerHTML.trim()
            : description?.innerHTML.trim()) as string,
          values: [...r.querySelectorAll(".item-value")].map(
            (v) => v.innerHTML.trim() as string
          ),
        };
      })
    );

    return summary;
  }

  private async getLastMovements(page: Page): Promise<IMovement[]> {
    const firstBarButton = await page.$$eval(
      '[id="menu:menuFrm:menu"]>ul>li',
      (lists) => {
        return lists.findIndex(
          (li) => li.querySelector(".label")?.textContent === "CONSULTAR"
        );
      }
    );
    await page.click(
      `[id="menu:menuFrm:menu"]>ul>li:nth-of-type(${firstBarButton + 1})`
    );

    await page.waitForSelector('[id="submenu_0"]');
    const lastMovementsButton = await page.$$eval(
      '[id="submenu_0"]>ul>li>a',
      (lists) => {
        return lists.findIndex((a) => a.textContent === "Últimos Movimientos");
      }
    );
    await page.click(
      `[id="submenu_0"]>ul>li:nth-of-type(${lastMovementsButton + 1})>a`
    );

    await page.waitForTimeout(1000);
    const movements = await page.$$eval("tr.even,tr.odd", (rows) => {
      const getColumn = (id: number) => {
        return `td:nth-of-type(${id})`;
      };

      return rows.map((row) => ({
        date: row.querySelector(getColumn(1))?.textContent?.trim() as string,
        description: row
          .querySelector(getColumn(2))
          ?.textContent?.trim() as string,
        receipt: row.querySelector(getColumn(3))?.textContent?.trim() as string,
        ars: row.querySelector(getColumn(4))?.textContent?.trim() as string,
        usd: row.querySelector(getColumn(5))?.textContent?.trim() as string,
      }));
    });

    return movements;
  }

  private async getAuthorizations(page: Page): Promise<IAuthorization[]> {
    const firstBarButton = await page.$$eval(
      '[id="menu:menuFrm:menu"]>ul>li',
      (lists) => {
        return lists.findIndex(
          (li) => li.querySelector(".label")?.textContent === "CONSULTAR"
        );
      }
    );
    await page.click(
      `[id="menu:menuFrm:menu"]>ul>li:nth-of-type(${firstBarButton + 1})`
    );

    await page.waitForSelector('[id="submenu_0"]');
    const lastMovementsButton = await page.$$eval(
      '[id="submenu_0"]>ul>li>a',
      (lists) => {
        return lists.findIndex((a) => a.textContent === "Últimos Movimientos");
      }
    );
    await page.click(
      `[id="submenu_0"]>ul>li:nth-of-type(${lastMovementsButton + 1})>a`
    );

    await page.waitForTimeout(1000);

    const authorizationTab = await page.$$eval(".tabs-box ul li a", (tabs) =>
      tabs.findIndex((a) => a.textContent === "Autorizaciones pendientes")
    );

    await page.click(`.tabs-box ul li:nth-of-type(${authorizationTab + 1}) a`);

    await page.waitForTimeout(1000);

    const authorizations = await page.$$eval("tr.even,tr.odd", (rows) => {
      const getColumn = (id: number) => {
        return `td:nth-of-type(${id})`;
      };

      return rows.map((row) => ({
        date: row.querySelector(getColumn(1))?.textContent?.trim() as string,
        description: row
          .querySelector(getColumn(2))
          ?.textContent?.trim() as string,
        type: row.querySelector(getColumn(3))?.textContent?.trim() as string,
        ars: row.querySelector(getColumn(4))?.textContent?.trim() as string,
        usd: row.querySelector(getColumn(5))?.textContent?.trim() as string,
      }));
    });

    return authorizations;
  }
}
