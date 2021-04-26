import { Page } from "puppeteer";
import { ICardBase, IMovement, ISummaryDetail } from "../interfaces/card";

export const selectCard = async (
  page: Page,
  position: number
): Promise<void> => {
  const cardSelect = "[id='cardsDropDown']";
  const cardList = "[id='cardContent']>ul";

  await page.waitForSelector(cardSelect);
  await page.click(cardSelect);
  await page.waitForSelector(cardList);
  await page.click(cardList + `>li:nth-of-type(${position})`);
  await page.waitForTimeout(1000);
};

export const getCardList = async (page: Page): Promise<ICardBase[]> => {
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
      const cardOwner = li.querySelector(".card-apellido-nombre")?.textContent;

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
};

export const getCardSummary = async (page: Page): Promise<ISummaryDetail[]> => {
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
};

export const getLastMovements = async (page: Page): Promise<IMovement[]> => {
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
};
