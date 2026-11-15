import categoryBootsImage from "../../assets/home/category-boots.png";
import categoryLoafersImage from "../../assets/home/category-loafers.png";
import categoryRunningImage from "../../assets/home/category-running.png";
import categorySandalsImage from "../../assets/home/category-sandals.png";
import categorySneakersImage from "../../assets/home/category-sneakers.png";
import dailyAuthenticImage from "../../assets/home/daily-authentic.png";
import dailyItaliaImage from "../../assets/home/daily-italia.png";
import dailyMexicoImage from "../../assets/home/daily-mexico.png";
import dailyOldskoolImage from "../../assets/home/daily-oldskool.png";
import dailySpeedcatImage from "../../assets/home/daily-speedcat.png";
import heroImage1 from "../../assets/home/hero-1.png";
import heroImage2 from "../../assets/home/hero-2.png";
import heroImage3 from "../../assets/home/hero-3.png";
import newCalmImage from "../../assets/home/new-calm.png";
import newCortezImage from "../../assets/home/new-cortez.png";
import newOrchidImage from "../../assets/home/new-orchid.png";
import newSpeedgoatImage from "../../assets/home/new-speedgoat.png";
import newVelocityImage from "../../assets/home/new-velocity.png";
import newWaveImage from "../../assets/home/new-wave.png";
import rainAdifomImage from "../../assets/home/rain-adifom.png";
import rainMidImage from "../../assets/home/rain-mid.png";
import rainOriginalImage from "../../assets/home/rain-original.png";
import rainPaytoImage from "../../assets/home/rain-payto.png";
import recommendBondiImage from "../../assets/home/recommend-bondi.png";
import recommendGelImage from "../../assets/home/recommend-gel.png";
import recommendUaImage from "../../assets/home/recommend-ua.png";
import recommendVomeroImage from "../../assets/home/recommend-vomero.png";
import detailMainImage from "../../assets/shop/detail-main.png";
import detailThumb1Image from "../../assets/shop/detail-thumb-1.png";
import detailThumb2Image from "../../assets/shop/detail-thumb-2.png";
import detailThumb3Image from "../../assets/shop/detail-thumb-3.png";
import exploreHanaImage from "../../assets/shop/explore-hana.png";
import exploreHyunjinImage from "../../assets/shop/explore-hyunjin.png";
import exploreJaeminImage from "../../assets/shop/explore-jaemin.png";
import exploreMinImage from "../../assets/shop/explore-min.png";
import exploreO0808Image from "../../assets/shop/explore-o0808.png";
import list1080Image from "../../assets/shop/list-1080.png";
import listDeviateImage from "../../assets/shop/list-deviate.png";
import listMagnifyImage from "../../assets/shop/list-magnify.png";
import listMaxcourtImage from "../../assets/shop/list-maxcourt.png";
import listVomeroImage from "../../assets/shop/list-vomero.png";
import listVomero18Image from "../../assets/shop/list-vomero18.png";
import listWaveImage from "../../assets/shop/list-wave.png";
import wishAdizeroImage from "../../assets/shop/wish-adizero.png";
import wishDionImage from "../../assets/shop/wish-dion.png";
import wishHeritageImage from "../../assets/shop/wish-heritage.png";
import wishMagmaxImage from "../../assets/shop/wish-magmax.png";
import wishSuregripImage from "../../assets/shop/wish-suregrip.png";
import resultProduct1Image from "../../assets/measure/result-product-1.png";
import resultProduct2Image from "../../assets/measure/result-product-2.png";
import resultProduct3Image from "../../assets/measure/result-product-3.png";
import resultProduct4Image from "../../assets/measure/result-product-4.png";

export type ShopProduct = {
  id: string;
  image: string;
  brand: string;
  name: string;
  price: string;
  badge?: string;
  color?: string;
  detailImages?: string[];
  recommendedSize?: string;
};

export type CartItem = {
  productId: string;
  size: string;
  quantity: number;
};

export const categories = [
  { label: "ALL", image: null },
  { label: "러닝화", image: categoryRunningImage },
  { label: "스니커즈", image: categorySneakersImage },
  { label: "샌들", image: categorySandalsImage },
  { label: "부츠", image: categoryBootsImage },
  { label: "로퍼", image: categoryLoafersImage },
];

export const heroSlides = [
  {
    image: heroImage3,
    title: "FIND YOUR FIT",
    description: "AI 발 분석으로 찾는 가장 정확한 나만의 핏.",
  },
  {
    image: heroImage2,
    title: "내 발을 위한 새로운 기준",
    description: "AI가 분석한 발 데이터로 더 정확한 사이즈를 완성하다.",
  },
  {
    image: heroImage1,
    title: "더 나은 핏을 시작해",
    description: "AI가 찾아낸 나만의 사이즈, 더 정확하게 더 편안하게.",
  },
];

export const newProducts = [
  {
    id: "cortez",
    image: newCortezImage,
    brand: "adidas",
    name: "코르테즈 텍스타일",
    price: "139,000원",
    badge: "무료배송",
  },
  {
    id: "calm",
    image: newCalmImage,
    brand: "Nike",
    name: "나이키 캄 뮬 W",
    price: "79,000원",
    badge: "AI 추천",
  },
  {
    id: "orchid",
    image: newOrchidImage,
    brand: "Taw&Toe",
    name: "오르케트로 샌들 W",
    price: "69,000원",
  },
  {
    id: "speedgoat",
    image: newSpeedgoatImage,
    brand: "HOKA",
    name: "스피드고트 6",
    price: "189,000원",
  },
  {
    id: "velocity",
    image: newVelocityImage,
    brand: "Saucony",
    name: "벨로시티 나이트로 4 AP",
    price: "159,000원",
    badge: "무료배송",
  },
  {
    id: "wave",
    image: newWaveImage,
    brand: "Mizuno",
    name: "웨이브 프로페시 LS",
    price: "219,000원",
  },
];

export const fitProducts = [
  {
    id: "bondi",
    image: recommendBondiImage,
    brand: "Hoka",
    name: "본디 8",
    price: "199,000원",
  },
  {
    id: "vomero",
    image: recommendVomeroImage,
    brand: "Nike",
    name: "나이키 보메로 18",
    price: "179,000원",
  },
  {
    id: "gel",
    image: recommendGelImage,
    brand: "ASICS",
    name: "젤 카야노 31",
    price: "189,000원",
  },
  {
    id: "ua",
    image: recommendUaImage,
    brand: "UA",
    name: "UA 호버 팬텀",
    price: "159,000원",
  },
];

export const dailyProducts = [
  {
    id: "authentic",
    image: dailyAuthenticImage,
    brand: "반스",
    name: "어센틱 - 데크 스웨이드",
    price: "79,000원",
  },
  {
    id: "italia",
    image: dailyItaliaImage,
    brand: "adidas",
    name: "이탈리아 70s",
    price: "159,000원",
  },
  {
    id: "speedcat",
    image: dailySpeedcatImage,
    brand: "puma",
    name: "스피드캣 고 우먼스",
    price: "119,000원",
    badge: "Fit For You",
  },
  {
    id: "oldskool",
    image: dailyOldskoolImage,
    brand: "Vans",
    name: "올드스쿨 36",
    price: "89,000원",
  },
  {
    id: "mexico",
    image: dailyMexicoImage,
    brand: "Onitsuka",
    name: "멕시코 66",
    price: "149,000원",
  },
];

export const rainProducts = [
  {
    id: "rain-adifom",
    image: rainAdifomImage,
    brand: "adidas",
    name: "아디폼 슈퍼스타 부츠",
    price: "129,000원",
    badge: "Fit For You",
  },
  {
    id: "rain-hunter",
    image: rainOriginalImage,
    brand: "헌터",
    name: "[WOMEN] 오리지날 플레이 숏 레인부츠",
    price: "149,000원",
  },
  {
    id: "rain-oz",
    image: rainMidImage,
    brand: "오즈",
    name: "토트 레인부츠 미들",
    price: "69,900원",
  },
  {
    id: "rain-payto",
    image: rainPaytoImage,
    brand: "핏플랍",
    name: "페이토 레인부츠",
    price: "89,000원",
  },
];

export const wishlistProducts = [
  {
    id: "magmax",
    image: wishMagmaxImage,
    brand: "puma",
    name: "맥그맥스 나이트로 2 우먼스",
    price: "238,000원",
    badge: "Fit For You",
  },
  {
    id: "suregrip",
    image: wishSuregripImage,
    brand: "onitsuka",
    name: "슈어그립 스니커즈",
    price: "248,000원",
    badge: "Fit For You",
  },
  {
    id: "dion",
    image: wishDionImage,
    brand: "crocs",
    name: "DION BROWN",
    price: "168,000원",
  },
  {
    id: "heritage",
    image: wishHeritageImage,
    brand: "닥터마틴",
    name: "(남성) 헤리티지 부츠",
    price: "145,000원",
  },
  {
    id: "adizero",
    image: wishAdizeroImage,
    brand: "adidas",
    name: "아디제로 보스턴 14 M",
    price: "189,000원",
  },
];

export const catalogProducts = [
  {
    id: "list-wave",
    image: listWaveImage,
    brand: "adidas",
    name: "맥스코트 미드탑",
    price: "109,000원",
  },
  {
    id: "list-vomero",
    image: listVomeroImage,
    brand: "Nike",
    name: "보메로 플러스 W",
    price: "179,000원",
    badge: "Fit For You",
  },
  {
    id: "list-vomero18",
    image: listVomero18Image,
    brand: "Nike",
    name: "보메로 18 M",
    price: "189,000원",
  },
  {
    id: "list-maxcourt",
    image: listMaxcourtImage,
    brand: "Nike",
    name: "맥스코트",
    price: "98,000원",
  },
  {
    id: "list-magnify",
    image: listMagnifyImage,
    brand: "puma",
    name: "매그니파이 나이트로 4",
    price: "219,000원",
  },
  {
    id: "list-1080",
    image: list1080Image,
    brand: "New Balance",
    name: "프레쉬폼 1080",
    price: "179,000원",
  },
  {
    id: "list-deviate",
    image: listDeviateImage,
    brand: "puma",
    name: "디비에이트 나이트로",
    price: "199,000원",
  },
];

export const explorePosts = [
  { id: "jaemin", image: exploreJaeminImage, author: "jaemin12", likes: 34 },
  { id: "hana", image: exploreHanaImage, author: "hana", likes: 91 },
  { id: "min", image: exploreMinImage, author: "min", likes: 46 },
  { id: "hyunjin", image: exploreHyunjinImage, author: "hyunjin", likes: 30 },
  { id: "o0808", image: exploreO0808Image, author: "o0808", likes: 22 },
];

export const searchableProducts = [
  ...newProducts,
  ...fitProducts,
  ...dailyProducts,
  ...rainProducts,
  ...wishlistProducts,
  ...catalogProducts,
] satisfies ShopProduct[];

export const shopProducts = Array.from(
  new Map(searchableProducts.map((product) => [product.id, product])).values(),
);

export const detailProductOverrides: Record<string, Partial<ShopProduct>> = {
  magmax: {
    image: detailMainImage,
    detailImages: [
      detailMainImage,
      detailThumb1Image,
      detailThumb2Image,
      detailThumb3Image,
    ],
    color: "루비 레드-로열 사파이어",
    price: "239,000원",
    recommendedSize: "225",
  },
};

export const productSizes = Array.from({ length: 19 }, (_, index) =>
  String(210 + index * 5),
);

export const defaultCartItems: CartItem[] = [];

export const measurementResultProducts = [
  {
    id: "result-1",
    image: resultProduct1Image,
    brand: "Nike",
    name: "에어맥스 포털",
    price: "129,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-2",
    image: resultProduct2Image,
    brand: "adidas",
    name: "슈퍼스타 로우",
    price: "139,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-3",
    image: resultProduct3Image,
    brand: "Asics",
    name: "젤 카야노 31",
    price: "189,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-4",
    image: resultProduct4Image,
    brand: "Puma",
    name: "스피드캣 우먼스",
    price: "119,000원",
    badge: "✨ Fit for You",
  },
];
