/* Cœurete — catalogue, settings and shared copy.
   Prices are prototype values (MAD). Edit here; every page reads from this file. */
window.CQ = window.CQ || {};

CQ.settings = {
  currency: "MAD",
  demo: false,               // true = never send orders (useful for a public preview on a custom domain)
  shipping: 30,              // livraison partout au Maroc
  freeShippingFrom: 400,     // livraison offerte dès ce montant (après remise)
  multiBuyQty: 2,            // -10% dès 2 t-shirts
  multiBuyRate: 0.10,
  giftWrap: 25,
  promo: { COEUR10: 0.10 },  // non cumulable avec le pack : le meilleur avantage s'applique
  whatsapp: "212600000000",  // TODO : remplacer par le vrai numéro (format international, sans +)
  whatsappDisplay: "+212 6 00 00 00 00",
  instagram: "coeurete",
  sizes: ["S", "M", "L", "XL", "XXL"]
};

CQ.moods = [
  { id: "oser",      label: "Oser",      line: "pour le jour où tu te lances" },
  { id: "tenir-bon", label: "Tenir bon", line: "pour les semaines qui pèsent" },
  { id: "sourire",   label: "Sourire",   line: "pour garder la lumière allumée" },
  { id: "s-aimer",   label: "S’aimer",   line: "pour te rappeler ce que tu vaux" }
];

CQ.colors = {
  blanc:      { label: "Blanc",      hex: "#F7F6F2" },
  noir:       { label: "Noir",       hex: "#141213" },
  gris:       { label: "Gris",       hex: "#A9A9A7" },
  anthracite: { label: "Anthracite", hex: "#3A3A3B" },
  kaki:       { label: "Kaki",       hex: "#5E5E43" },
  "bleu-ciel":{ label: "Bleu ciel",  hex: "#9CC8EA" },
  rose:       { label: "Rose",       hex: "#F2A7C0" },
  beige:      { label: "Beige",      hex: "#E3D6C1" }
};

/* n = position on the collection board (1–16) → image files img/tees/NN-front|back */
CQ.products = [
  { n: 1,  slug: "la-vie-est-belle",        msg: "La vie est belle.",        color: "blanc",      price: 199, mood: "sourire",
    art: "Au dos, deux cœurs se tiennent la main : un rouge couronné, un noir, et des petits cœurs qui flottent autour." },
  { n: 2,  slug: "reve-grand",              msg: "Rêve grand.",              color: "noir",       price: 249, mood: "oser", pick: true,
    art: "Au dos, un cœur rouge et un cœur blanc couronné, main dans la main, sous un petit cœur rouge." },
  { n: 3,  slug: "tout-ira-bien",           msg: "Tout ira bien.",           color: "gris",       price: 229, mood: "tenir-bon",
    art: "Au dos, un cœur bleu et un cœur rouge, debout sur une colline, sous un soleil griffonné." },
  { n: 4,  slug: "ca-va-passer",            msg: "Ça va passer.",            color: "anthracite", price: 249, mood: "tenir-bon",
    art: "Au dos, un grand cœur tracé à la craie blanche, couronné, qui tient debout tout seul." },
  { n: 5,  slug: "good-vibes",              msg: "Good vibes.",              color: "kaki",       price: 179, mood: "sourire",
    art: "Au dos, un cœur en chapeau de pêcheur qui tend une fleur, dessiné en traits crème." },
  { n: 6,  slug: "tout-est-possible",       msg: "Tout est possible.",       color: "bleu-ciel",  price: 269, mood: "oser",
    art: "Au dos, un cœur bleu couronné, assis sur un fil, au milieu des nuages." },
  { n: 7,  slug: "sois-toi-meme",           msg: "Sois toi-même.",           color: "rose",       price: 299, mood: "s-aimer", pick: true,
    art: "Au dos, un cœur rouge et un cœur violet main dans la main, chaussures assorties." },
  { n: 8,  slug: "le-bonheur-est-simple",   msg: "Le bonheur est simple.",   color: "beige",      price: 219, mood: "sourire",
    art: "Au dos, un cœur brun qui tient une marguerite, sous un petit soleil." },
  { n: 9,  slug: "on-se-retrouve-toujours", msg: "On se retrouve toujours.", color: "blanc",      price: 329, mood: "s-aimer",
    art: "Au dos, un cœur rouge qui fait coucou, son skate posé à côté de lui." },
  { n: 10, slug: "crois-en-toi",            msg: "Crois en toi.",            color: "noir",       price: 259, mood: "oser",
    art: "Au dos, un cœur bleu et un cœur rouge assis sur un banc, sous la lune et les étoiles." },
  { n: 11, slug: "la-vie-est-un-cadeau",    msg: "La vie est un cadeau.",    color: "gris",       price: 289, mood: "sourire",
    art: "Au dos, un cœur noir couronné qui sort d’une boîte cadeau, un petit cœur rouge à la main." },
  { n: 12, slug: "fais-de-ton-mieux",       msg: "Fais de ton mieux.",       color: "anthracite", price: 239, mood: "tenir-bon",
    art: "Au dos, un cœur rouge et un cœur bleu côte à côte, prêts à avancer." },
  { n: 13, slug: "un-jour-a-la-fois",       msg: "Un jour à la fois.",       color: "kaki",       price: 199, mood: "tenir-bon",
    art: "Au dos, un cœur rouge couronné qui prend le temps de s’asseoir." },
  { n: 14, slug: "tu-es-assez",             msg: "Tu es assez.",             color: "bleu-ciel",  price: 279, mood: "s-aimer",
    art: "Au dos, un cœur qui tient tout un bouquet de ballons-cœurs rouges, blancs et bleus." },
  { n: 15, slug: "fais-briller-ton-coeur",  msg: "Fais briller ton cœur.",   color: "rose",       price: 349, mood: "oser", pick: true,
    art: "Au dos, un cœur rouge couronné à côté d’une fleur, tracé à gros coups de crayon." },
  { n: 16, slug: "ici-et-maintenant",       msg: "Ici et maintenant.",       color: "beige",      price: 189, mood: "s-aimer",
    art: "Au dos, un cœur noir et un cœur rouge assis sur une barrière, sous le soleil." }
];

CQ.sizeGuide = [
  // taille, largeur poitrine (cm, à plat), longueur (cm)
  ["S", 54, 70], ["M", 57, 72], ["L", 60, 74], ["XL", 63, 76], ["XXL", 66, 78]
];

CQ.cities = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kénitra",
  "Tétouan", "Salé", "Témara", "Mohammédia", "El Jadida", "Safi", "Béni Mellal", "Nador", "Khouribga",
  "Settat", "Laâyoune", "Essaouira", "Ifrane", "Dakhla", "Autre ville"];

CQ.find = slug => CQ.products.find(p => p.slug === slug);
CQ.img = (p, side, w) => `img/tees/${String(p.n).padStart(2, "0")}-${side}-${w}.webp`;
CQ.money = v => `${Math.round(v).toLocaleString("fr-FR")} MAD`;
