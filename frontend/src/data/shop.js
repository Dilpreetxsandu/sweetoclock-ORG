// Static content for Sweet'O Clock storefront. Products come from the backend API.
const GEN = "https://static.prod-images.emergentagent.com/jobs/7e3f0152-49d7-49d6-9fea-0836246843ac/images/";

export const TESTIMONIALS = [
  { quote: "Tasted exactly like what my grandmother used to make. Absolutely authentic.", name: "Priya Sharma", city: "Mumbai", rating: 5 },
  { quote: "Sent a Diwali hamper — the packaging alone made everyone gasp.", name: "Rahul Mehta", city: "Delhi", rating: 5 },
  { quote: "Motichoor Ladoos are out of this world. Ordered twice this month.", name: "Ananya Patel", city: "Ahmedabad", rating: 5 },
  { quote: "Perfect Gulab Jamun — soft but never falling apart. Cardamom balanced beautifully.", name: "Vikram Singh", city: "Jaipur", rating: 4 },
  { quote: "My parents called immediately after opening the box. Big win.", name: "Sneha Kulkarni", city: "Pune", rating: 5 },
  { quote: "Pure ghee aroma the moment I opened the lid. You can't fake that.", name: "Ramesh Gupta", city: "Lucknow", rating: 5 },
  { quote: "The Kaju Katli is unreal — thin, delicate, silver-leafed to perfection.", name: "Meera Iyer", city: "Bangalore", rating: 5 },
  { quote: "Ordered corporate gifts, got compliments for two weeks straight.", name: "Aditya Rao", city: "Hyderabad", rating: 5 },
];

export const AVATARS = [
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=54",
  "https://i.pravatar.cc/120?img=29",
  "https://i.pravatar.cc/120?img=12",
  "https://i.pravatar.cc/120?img=47",
  "https://i.pravatar.cc/120?img=68",
  "https://i.pravatar.cc/120?img=22",
  "https://i.pravatar.cc/120?img=15",
];

export const OFFERS = [
  {
    id: "festive",
    kicker: "Festive Special",
    title: "Kaju Katli Box",
    priceLine: "at ₹499 only",
    body: "Premium cashew sweets, silver-leafed, in a 500g gifting case. Every bite is celebration.",
    cta: "Order the box",
    img: GEN + "6c394dccf5585c73123459c0b5a8c2c82ade2293ad6b9a40369a5e7705833c30.jpeg",
  },
  {
    id: "mango",
    kicker: "Limited Edition",
    title: "Mango Ladoo",
    priceLine: "seasonal · Alphonso",
    body: "Peak-season Alphonso puréed with cashew and cardamom. No colours, no essences — while it lasts.",
    cta: "Grab yours",
    img: GEN + "5dd8bf2b0d8b4d0af3c9c71652aa312c443e7d0f6076773de07d8c40f39ca5b8.jpeg",
  },
  {
    id: "hamper",
    kicker: "Gift Ready",
    title: "Festive Hamper",
    priceLine: "from ₹899",
    body: "Six premium mithais in a hand-finished wooden box. Weddings, Diwali, corporate — sorted.",
    cta: "Explore hampers",
    img: GEN + "1794143f4787f1b2d16b4c91ac2aa34b7f5a7566140ad75104d7bef4af34090c.jpeg",
  },
];

export const CHAPTERS = [
  { n: "01", title: "Sourced, not bought.", body: "Cashews from Goa's Vengurla groves. Saffron from Pampore in Kashmir. Green cardamom from Idukki. We pay farmers directly, we wait for the season, we don't compromise for calendar dates." },
  { n: "02", title: "Ghee is the whole thing.", body: "Every mithai starts with bilona A2 cow ghee, cultured for two days in earthen pots. It's slower, it's dearer, it's the reason your grandmother's kitchen smelled the way it did." },
  { n: "03", title: "Made this morning.", body: "Nothing frozen, nothing warehoused. What you receive today was hand-rolled between 4 and 6am the day it shipped. If we can't ship it fresh, we don't ship it." },
  { n: "04", title: "Zero shortcuts.", body: "No preservatives. No artificial colour. No flavour essences. No refined khoya. If our great-grandmother wouldn't have used it, neither do we." },
];

export const MARQUEE_WORDS = ["Kaju Katli", "Motichoor", "Rasgulla", "Jalebi", "Barfi", "Ghee", "Saffron", "Cardamom", "Chhena", "Khoya"];

export const getCategories = (products) => ["All", ...new Set(products.map((p) => p.category))];
