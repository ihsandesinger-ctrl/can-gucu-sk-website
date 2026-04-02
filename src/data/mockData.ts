export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  image: string;
  category: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  image: string;
}

export interface Team {
  id: string;
  name: string;
  coach: {
    name: string;
    title: string;
    image: string;
  };
  players: Player[];
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export const news: NewsItem[] = [
  {
    id: "1",
    title: "Çan Kent Konseyi'ne Ziyaret!",
    summary: "Çangücü Spor Kulübü olarak, Kent Konseyi Başkanı Turhan Demir ile bir araya geldik.",
    date: "01.04.2026",
    image: "https://picsum.photos/seed/cankent/800/600",
    category: "HABER"
  },
  {
    id: "2",
    title: "Çan Karayolu Yük Taşıma Kooperatifi'ne Ziyaret!",
    summary: "Çangücü Spor Kulübü olarak, ilçemizin önemli yapı taşlarından biri olan Çan Karayolu Yük Taşıma Kooperatifi'ne gerçekleştirdiğimiz ziyaret kapsamında, Kooperatif Başkanı İsmail Bulut ile bir araya geldik.",
    date: "01.04.2026",
    image: "https://picsum.photos/seed/cankoop/800/600",
    category: "HABER"
  },
  {
    id: "3",
    title: "Çan Küçük Sanayi Sitesi'ne Ziyaret!",
    summary: "Çangücü Spor Kulübü olarak, ilçemizin önemli değerlerinden biri olan Çan Küçük Sanayi Sitesi'ne gerçekleştirdiğimiz ziyaret kapsamında, Çan Küçük Sanayi Sitesi Başkanı Kadir Deveci ile bir araya geldik.",
    date: "01.04.2026",
    image: "https://picsum.photos/seed/cansanayi/800/600",
    category: "HABER"
  }
];

export const teams: Team[] = [
  {
    id: "u-11",
    name: "U-11 Takımı",
    coach: {
      name: "Musacan KUTLU",
      title: "U-11 Baş Antrenörü",
      image: "https://picsum.photos/seed/coach1/200/200"
    },
    players: [
      { id: "1", name: "Kadir Yağız ÖZTÜRK", position: "Kaleci", number: 1, image: "https://picsum.photos/seed/p1/400/400" },
      { id: "2", name: "İsmail GÜMÜŞ", position: "Defans", number: 2, image: "https://picsum.photos/seed/p2/400/400" },
      { id: "3", name: "Yasir SOYKAYA", position: "Orta Saha", number: 3, image: "https://picsum.photos/seed/p3/400/400" },
      { id: "4", name: "Ali Çınar SERT", position: "Defans", number: 4, image: "https://picsum.photos/seed/p4/400/400" },
      { id: "5", name: "Yiğitalp KARADENİZ", position: "Defans", number: 5, image: "https://picsum.photos/seed/p5/400/400" }
    ]
  }
];

export const matches: Match[] = [
  {
    id: "m1",
    homeTeam: "Çangücü SK",
    awayTeam: "Rakip Takım 1",
    date: "05.04.2026",
    time: "14:00",
    location: "Çan Şehir Stadı",
    category: "U-11"
  },
  {
    id: "m2",
    homeTeam: "Çangücü SK",
    awayTeam: "Rakip Takım 2",
    date: "12.04.2026",
    time: "16:00",
    location: "Çan Şehir Stadı",
    category: "U-12"
  }
];
