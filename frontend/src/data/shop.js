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
    id: "laddoo",
    kicker: "Best Seller",
    title: "Laddoo",
    priceLine: "₹599 / kg",
    body: "Slow-roasted gram flour folded into pure A2 ghee, hand-rolled warm and crowned with almond. The house favourite since day one.",
    cta: "Order laddoo",
    img: "/products/laddo-2.jpg",
  },
  {
    id: "khajur",
    kicker: "Sugar Free",
    title: "Khajur Fudge",
    priceLine: "₹899 / kg",
    body: "Dates crushed with pistachio, cashew and almond — no added sugar, no syrup. Dense, dark and quietly luxurious.",
    cta: "Try the fudge",
    img: "/products/khajur-2.jpg",
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
