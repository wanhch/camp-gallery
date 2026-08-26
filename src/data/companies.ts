import type { Company } from "../types";

const companyDetails = [
  ["破晓先锋", "迎着第一束光，先行一步", "以快速集合与高标准执行力开场，把每一次口令都化成整齐有力的回应。"],
  ["同心砺剑", "同心，同向，同进", "在并肩协作中磨砺意志，让来自不同专业的伙伴成为可靠的战友。"],
  ["勇毅前行", "脚步铿锵，向难而行", "把训练场上的每一次坚持，沉淀为面对技术挑战时的韧性与担当。"],
  ["追光而上", "心有目标，步履不停", "用昂扬状态奔向共同目标，在日复一日的训练中看见更好的自己。"],
  ["聚力成峰", "聚微光，成高峰", "每个人都是队伍不可缺少的一束光，协作让彼此的力量被真正看见。"],
  ["智创未来", "以青春智见，创计算未来", "把集训中的纪律、专注和敏捷，带进未来的工程现场与创新实践。"],
  ["不负韶华", "此刻全力，青春无悔", "用汗水记录最真实的成长，把年轻人的热烈写进这个共同的夏天。"],
  ["向新而生", "每天进步一点，再快一点", "保持开放与好奇，在全新的环境中迅速学习、主动连接、共同成长。"],
  ["乘风破浪", "不惧风雨，敢闯敢为", "面对陌生任务依旧果断行动，用团队默契穿越每一次困难与考验。"],
  ["知行合一", "知于心，践于行", "从理解要求到完成动作，以清晰、准确、可靠的行动回应每一项任务。"],
  ["众志成城", "一群人，一条心，一个目标", "让个体优势在团队中汇聚，以彼此托举的方式共同抵达终点。"],
  ["全力以赴", "站上训练场，就做到最好", "不为自己设限，在每一个需要咬牙坚持的时刻再向前一步。"],
  ["锐意进取", "锐气在心，进取在行", "保持年轻人的锋芒与工程师的严谨，在训练中不断校准更高标准。"],
  ["步履不停", "积跬步，至远方", "珍惜每一次重复与打磨，相信扎实的日常终会汇成可靠的专业能力。"],
  ["青春担当", "挺膺担当，奔赴所爱", "在集体中承担责任、回应信任，让青春的价值落在真实行动里。"],
  ["共赴曙光", "此刻并肩，未来同行", "从集训场出发，带着共同记忆与坚定目光，奔赴属于新曙光人的未来。"]
] as const;

const images = [
  "/demo/hero-huddle.jpg",
  "/demo/team-game.jpg",
  "/demo/team-briefing.jpg",
  "/demo/team-energy.jpg",
  "/demo/outdoor-collab.jpg",
  "/demo/campus-collab.jpg",
  "/demo/field-training.jpg",
  "/demo/warmup.jpg"
];

const accents = ["#b71f2a", "#1f6b4a", "#c37a25", "#267384"];

export const companies: Company[] = companyDetails.map((detail, index) => ({
  id: index + 1,
  number: String(index + 1).padStart(2, "0"),
  name: detail[0],
  motto: detail[1],
  summary: detail[2],
  image: images[index % images.length],
  accent: accents[index % accents.length],
  members: 46
}));

export const getCompany = (id: number) => companies.find((company) => company.id === id) ?? companies[0];
