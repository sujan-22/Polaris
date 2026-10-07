/*
 * The launch catalogue. Rewritten from the original products.js: same goods
 * and photography, cleaner names, real sizes, and images tagged with the
 * colour they show so the product page can follow the shopper's pick.
 */

import type { CategorySlug, CollectionKey } from "../src/lib/catalog";

export interface SeedSeller {
    key: string;
    name: string;
    storeName: string;
}

export const SELLERS: SeedSeller[] = [
    { key: "sujan", name: "Sujan", storeName: "Polaris Supply" },
    { key: "jay", name: "Jay", storeName: "Northline" },
    { key: "margaret", name: "Margaret", storeName: "Hearth Goods" },
    { key: "olivia", name: "Olivia", storeName: "Olive & Oak" },
    { key: "michael", name: "Michael", storeName: "Trailhead" },
    { key: "thomas", name: "Thomas", storeName: "Common Thread" },
    { key: "alex", name: "Alex", storeName: "Fieldnote" },
    { key: "david", name: "David", storeName: "Little Ritual" },
];

export interface SeedProduct {
    name: string;
    seller: string;
    category: CategorySlug;
    collection?: CollectionKey;
    price: number;
    compareAt?: number;
    colors: string[];
    sizes: string[];
    /** File names in /public/products, each optionally tagged with a colour. */
    images: [file: string, color?: string][];
    description: string;
    details: string[];
}

const BABY = ["0–6M", "6–12M", "12–24M"];
const ADULT = ["S", "M", "L", "XL"];
const ONE = ["One size"];

export const PRODUCTS: SeedProduct[] = [
    {
        name: "Baby Beanie",
        seller: "sujan",
        category: "baby",
        price: 7.99,
        compareAt: 10.99,
        colors: ["Black", "Gray", "White"],
        sizes: BABY,
        images: [
            ["baby-cap-black", "Black"],
            ["baby-cap-gray", "Gray"],
            ["baby-cap-white", "White"],
        ],
        description:
            "A soft rib-knit beanie with a turned-up cuff and the Polaris peak on the fold. Warm without being bulky, and gentle on new skin.",
        details: ["Cotton-blend rib knit", "Double-layer cuff", "Machine wash cold"],
    },
    {
        name: "Baby Onesie",
        seller: "margaret",
        category: "baby",
        price: 19.99,
        compareAt: 24.99,
        colors: ["Beige", "Black", "White"],
        sizes: BABY,
        images: [
            ["baby-onesie-beige-1", "Beige"],
            ["baby-onesie-beige-2", "Beige"],
            ["baby-onesie-black-1", "Black"],
            ["baby-onesie-black-2", "Black"],
            ["baby-onesie-white-1", "White"],
            ["baby-onesie-white-2", "White"],
        ],
        description:
            "A short-sleeve bodysuit in breathable cotton jersey, with envelope shoulders for quick changes and a small peak at the chest.",
        details: ["100% cotton jersey", "Envelope neckline", "Three-snap closure"],
    },
    {
        name: "Drawstring Pouch",
        seller: "sujan",
        category: "bags",
        collection: "new_arrivals",
        price: 24.99,
        colors: ["Black", "White"],
        sizes: ONE,
        images: [
            ["bag-black", "Black"],
            ["bag-white", "White"],
        ],
        description:
            "A lightweight drawstring pouch for gym kit, shoes or the odds and ends that drift around a bag. Cord-lock closure and a printed peak.",
        details: ["Water-resistant nylon", "Cord-lock drawstring", "Packs flat"],
    },
    {
        name: "Bomber Jacket",
        seller: "olivia",
        category: "men",
        price: 49.99,
        colors: ["Olive", "Black"],
        sizes: ADULT,
        images: [
            ["bomber-jacket-army", "Olive"],
            ["bomber-jacket-black", "Black"],
        ],
        description:
            "A classic bomber with ribbed collar, cuffs and hem, a full-length zip and a small peak on the chest. Light enough for spring, easy to layer in winter.",
        details: ["Water-repellent shell", "Ribbed trims", "Two welt pockets"],
    },
    {
        name: "Western Hat",
        seller: "michael",
        category: "accessories",
        price: 34.99,
        compareAt: 39.99,
        colors: ["Black", "Tan"],
        sizes: ONE,
        images: [
            ["cowboy-hat-black-1", "Black"],
            ["cowboy-hat-black-2", "Black"],
            ["cowboy-hat-black-4", "Black"],
            ["cowboy-hat-black-6", "Black"],
            ["cowboy-hat-tan-1", "Tan"],
            ["cowboy-hat-tan-2", "Tan"],
            ["cowboy-hat-tan-4", "Tan"],
            ["cowboy-hat-tan-6", "Tan"],
        ],
        description:
            "A felt western hat with a pinched crown, a wide brim and a band of silver concho studs. Keeps the sun off and looks good doing it.",
        details: ["Wool felt", "Concho hat band", "Pre-shaped brim"],
    },
    {
        name: "Ceramic Cup",
        seller: "sujan",
        category: "home",
        collection: "new_arrivals",
        price: 14.99,
        colors: ["Black", "White"],
        sizes: ONE,
        images: [
            ["cup-black", "Black"],
            ["cup-white", "White"],
        ],
        description:
            "A tapered stoneware cup with a matte glaze, sized for a flat white or a long pour of tea. Stacks neatly and sits well in the hand.",
        details: ["Stoneware, matte glaze", "300 ml", "Dishwasher safe"],
    },
    {
        name: "Dog Sweater",
        seller: "michael",
        category: "pets",
        price: 19.99,
        compareAt: 24.99,
        colors: ["Black"],
        sizes: ["S", "M", "L"],
        images: [["dog-sweater-1"], ["dog-sweater-2"]],
        description:
            "A knit sweater for dogs that run cold, with a high neck, leg openings that don't rub and a peak on the back.",
        details: ["Soft acrylic knit", "Pull-on fit", "Machine wash cold"],
    },
    {
        name: "Everyday Cap",
        seller: "thomas",
        category: "accessories",
        collection: "new_arrivals",
        price: 15.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["hat-1"], ["hat-2"], ["hat-3"]],
        description:
            "A six-panel cap in brushed cotton twill with an embroidered peak, a curved brim and an adjustable strap at the back.",
        details: ["Cotton twill", "Embroidered logo", "Adjustable strap"],
    },
    {
        name: "Zip Hoodie",
        seller: "jay",
        category: "women",
        price: 39.99,
        compareAt: 43.99,
        colors: ["Black"],
        sizes: ADULT,
        images: [["hoodie-1"], ["hoodie-2"]],
        description:
            "A midweight zip hoodie in brushed-back fleece, with contrast drawcords and a tonal peak at the chest. Cut with room to layer.",
        details: ["Cotton-blend fleece", "Contrast drawcords", "Two front pockets"],
    },
    {
        name: "Orbit Tee",
        seller: "thomas",
        category: "men",
        collection: "new_arrivals",
        price: 24.99,
        colors: ["Black", "Blue", "White"],
        sizes: ADULT,
        images: [
            ["t-shirt-circles-black", "Black"],
            ["t-shirt-circles-blue", "Blue"],
            ["t-shirt-circles-white", "White"],
        ],
        description:
            "A heavyweight tee printed with a loose orbit of line drawings across the front. Boxy through the body, with a ribbed crew neck.",
        details: ["100% cotton, 240 gsm", "Screen-printed graphic", "Boxy fit"],
    },
    {
        name: "Everyday Tee",
        seller: "alex",
        category: "men",
        collection: "weekly_picks",
        price: 22.99,
        compareAt: 25.99,
        colors: ["Black", "Blue", "Gray", "Pink", "White"],
        sizes: ADULT,
        images: [
            ["t-shirt-color-black", "Black"],
            ["t-shirt-color-blue", "Blue"],
            ["t-shirt-color-gray", "Gray"],
            ["t-shirt-color-pink", "Pink"],
            ["t-shirt-color-white", "White"],
        ],
        description:
            "The tee we reach for most: soft cotton jersey, a regular fit and a small peak on the chest. Five colours, all built to wash well.",
        details: ["Cotton jersey", "Regular fit", "Pre-shrunk"],
    },
    {
        name: "Daypack",
        seller: "jay",
        category: "bags",
        collection: "weekly_picks",
        price: 49.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["bag"]],
        description:
            "A compact backpack with a structured front pocket, adjustable straps and a top handle. Big enough for a laptop sleeve and a day's things.",
        details: ["Coated canvas", "Padded straps", "Fits a 13-inch laptop"],
    },
    {
        name: "Minimal Watch",
        seller: "margaret",
        category: "accessories",
        price: 149.99,
        compareAt: 199.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["watch"]],
        description:
            "A clean three-hand watch with a matte black case, an unnumbered dial and a soft leather strap. Nothing on it you don't need.",
        details: ["Quartz movement", "40 mm case", "Leather strap"],
    },
    {
        name: "Pullover Hoodie",
        seller: "alex",
        category: "women",
        collection: "weekly_picks",
        price: 39.99,
        colors: ["Black"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        images: [["black-hoodie"]],
        description:
            "A classic pullover in heavyweight fleece with a lined hood and a front pocket. Made for every season and every sofa.",
        details: ["Heavyweight fleece", "Lined hood", "Ribbed cuffs and hem"],
    },
    {
        name: "Wireless Headphones",
        seller: "jay",
        category: "electronics",
        collection: "weekly_picks",
        price: 79.99,
        compareAt: 89.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["headphone"]],
        description:
            "Over-ear headphones with a clear, balanced sound, cushioned ear cups and a battery that lasts the week. They fold flat for travel.",
        details: ["Bluetooth 5.3", "Up to 40 hours of playback", "Folding design"],
    },
    {
        name: "Cork Mug",
        seller: "david",
        category: "home",
        price: 9.99,
        compareAt: 16.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["mug-1"], ["mug-2"]],
        description:
            "A matte black mug on a cork base that protects the desk and keeps the heat off your hand.",
        details: ["Ceramic with cork base", "350 ml", "Hand wash"],
    },
    {
        name: "Pacifier",
        seller: "david",
        category: "baby",
        price: 13.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["pacifier-1"], ["pacifier-2"]],
        description:
            "A round pacifier with a natural rubber teat, shaped to let babies settle themselves. The shield is vented so skin can breathe.",
        details: ["Natural rubber teat", "BPA-free shield", "Ventilation holes"],
    },
    {
        name: "Slip-On Shoes",
        seller: "jay",
        category: "women",
        price: 45.99,
        colors: ["Blue"],
        sizes: ["6", "7", "8", "9", "10"],
        images: [["shoes-1"], ["shoes-2"], ["shoes-3"], ["shoes-4"]],
        description:
            "Canvas slip-ons in bright cobalt with a padded collar and a grippy vulcanised sole. Easy on, easy off.",
        details: ["Cotton canvas upper", "Vulcanised rubber sole", "Padded collar"],
    },
    {
        name: "Prism Tee",
        seller: "sujan",
        category: "men",
        collection: "weekly_picks",
        price: 25.99,
        compareAt: 29.99,
        colors: ["Black"],
        sizes: ADULT,
        images: [["t-shirt-spiral-1"], ["t-shirt-spiral-2"], ["t-shirt-spiral-3"], ["t-shirt-spiral-4"]],
        description:
            "A black tee with a gradient prism print built from fine lines. Heavyweight cotton, a relaxed fit and a small peak on the sleeve.",
        details: ["100% cotton", "Relaxed fit", "Printed sleeve logo"],
    },
    {
        name: "Countertop Blender",
        seller: "margaret",
        category: "electronics",
        collection: "new_arrivals",
        price: 175.99,
        compareAt: 199.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["blender-black"]],
        description:
            "A high-power blender with a single dial and a tall clear jar. Crushes ice, purées soup and makes a smooth smoothie in under a minute.",
        details: ["1,400 W motor", "1.8 L jar", "Variable speed dial"],
    },
    {
        name: "Task Chair",
        seller: "olivia",
        category: "home",
        collection: "new_arrivals",
        price: 125.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["chair-black"]],
        description:
            "A swivel chair with a moulded shell seat, a five-star base and smooth-rolling casters. Built for long days at the desk.",
        details: ["Moulded shell seat", "Height adjustable", "Five-star base"],
    },
    {
        name: "Clock Radio",
        seller: "alex",
        category: "electronics",
        price: 89.99,
        compareAt: 99.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["radio-black"]],
        description:
            "A compact clock radio with a warm speaker, an easy-to-read display and a proper tuning dial.",
        details: ["FM and AM radio", "Two alarms", "Dimmable display"],
    },
    {
        name: "Desk Lamp",
        seller: "michael",
        category: "home",
        price: 39.99,
        compareAt: 49.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["lamp-black"]],
        description:
            "A metal desk lamp with an angled shade and a weighted base. Throws a focused pool of light exactly where you need it.",
        details: ["Powder-coated steel", "E26 bulb", "Inline switch"],
    },
    {
        name: "Turntable",
        seller: "michael",
        category: "electronics",
        collection: "new_arrivals",
        price: 99.99,
        compareAt: 109.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["vinyl-black"]],
        description:
            "A belt-drive turntable with a built-in preamp, so it plugs straight into powered speakers. Plays 33 and 45.",
        details: ["Belt drive", "Built-in phono preamp", "33⅓ and 45 rpm"],
    },
    {
        name: "Mechanical Keyboard",
        seller: "jay",
        category: "electronics",
        collection: "weekly_picks",
        price: 129.99,
        colors: ["White"],
        sizes: ONE,
        images: [["keyboard"]],
        description:
            "A compact mechanical keyboard with tactile switches, PBT keycaps and an aluminium case. Wired or Bluetooth, your call.",
        details: ["Tactile switches", "PBT keycaps", "USB-C and Bluetooth"],
    },
    {
        name: "Webcam Cover",
        seller: "sujan",
        category: "electronics",
        collection: "new_arrivals",
        price: 6.99,
        colors: ["Black"],
        sizes: ONE,
        images: [["webcam-cover"]],
        description:
            "A slim sliding cover that sticks to your laptop bezel. Privacy with one thumb, and thin enough that the lid still closes.",
        details: ["Adhesive backed", "0.7 mm thin", "Fits most laptops"],
    },
];
