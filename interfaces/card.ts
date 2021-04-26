export interface ICard extends ICardBase {
  summary: ISummaryDetail[];
  movements: IMovement[];
}

export interface ICardBase {
  cardEntity: string;
  cardOwner: string;
  cardNumber: string;
  isAdditional: boolean;
}

export interface ISummaryDetail {
  description: string;
  values: string[];
}

export interface IMovement {
  date: string;
  description: string;
  receipt: string;
  ars: string;
  usd: string;
}
