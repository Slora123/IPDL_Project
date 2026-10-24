import { useState, useRef, useEffect } from "react";
import {
  MapPin, Store, Search, X, Package, Tag, Info,
  ChevronRight, ShoppingCart, IndianRupee, BarChart3,
  AlertTriangle, CheckCircle, HelpCircle, ArrowLeft,
  TrendingUp, Layers, Link2, BookOpen, Plus, Minus,
  BadgeCheck, Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useI18n } from "@/contexts/I18nContext";

// ── Types ────────────────────────────────────────────────────────────────────
interface TrendItem {
  id: string;
  shopCategory: string;
  product: string;
  unit: string;
  demandDriver: string;
  purchaseCost: number;
  sellingPrice: number;
  grossProfit: number;
  grossMarginPct: number;
  markupPct: number;
  profitRank: number;
  cheapestSource: string;
  alternateSource: string;
  bulkNote: string;
  priceBasis: "Web-anchored" | "Estimate";
  confidence: "High" | "Medium" | "Low";
  dataAsOf: string;
}

// ── Full CSV data (96 rows) ─────────────────────────────────────────────────
const TRENDS: TrendItem[] = [
  { id:"MUM-001", shopCategory:"Grocery Shop", product:"Arhar (Tur) dal", unit:"1 kg", demandDriver:"Daily staple; APMC modal rate ₹11,000/qtl (Sep 2026)", purchaseCost:110, sellingPrice:140, grossProfit:30, grossMarginPct:21.4, markupPct:27.3, profitRank:5, cheapestSource:"APMC Vashi grain/pulses market (auction rate)", alternateSource:"Udaan / IndiaMART pulses wholesalers", bulkNote:"Buy 30-50 kg bags; rates change daily", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-002", shopCategory:"Grocery Shop", product:"Chana dal", unit:"1 kg", demandDriver:"Daily staple; APMC modal rate ₹7,900/qtl (Sep 2026)", purchaseCost:79, sellingPrice:98, grossProfit:19, grossMarginPct:19.4, markupPct:24.1, profitRank:8, cheapestSource:"APMC Vashi grain/pulses market", alternateSource:"Udaan / IndiaMART pulses wholesalers", bulkNote:"Buy 30-50 kg bags", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-003", shopCategory:"Grocery Shop", product:"Urad whole (black gram)", unit:"1 kg", demandDriver:"Daily staple; APMC modal rate ₹10,500/qtl (2 Sep 2026)", purchaseCost:105, sellingPrice:132, grossProfit:27, grossMarginPct:20.5, markupPct:25.7, profitRank:6, cheapestSource:"APMC Vashi grain/pulses market", alternateSource:"Udaan / IndiaMART pulses wholesalers", bulkNote:"Buy 30-50 kg bags", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-004", shopCategory:"Grocery Shop", product:"Makhana (fox nut)", unit:"250 g pack", demandDriver:"Healthy-snacking demand (est.)", purchaseCost:130, sellingPrice:199, grossProfit:69, grossMarginPct:34.7, markupPct:53.1, profitRank:1, cheapestSource:"Masala Market, APMC Vashi (dry fruits/spices)", alternateSource:"Crawford Market dry-fruit lanes", bulkNote:"Repack from 5-10 kg cartons for better margin", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-005", shopCategory:"Grocery Shop", product:"Rolled oats", unit:"1 kg", demandDriver:"Health/breakfast shift; urban demand for superfoods growing ~20%/yr (web)", purchaseCost:100, sellingPrice:140, grossProfit:40, grossMarginPct:28.6, markupPct:40.0, profitRank:4, cheapestSource:"Masala Market, APMC Vashi", alternateSource:"FMCG distributor / Udaan", bulkNote:"Carton of 12 for best rate", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-006", shopCategory:"Grocery Shop", product:"Chia seeds", unit:"250 g pack", demandDriver:"Superfood/alt-flour demand (web: SIAL Paris, Apr 2025)", purchaseCost:110, sellingPrice:169, grossProfit:59, grossMarginPct:34.9, markupPct:53.6, profitRank:2, cheapestSource:"Masala Market, APMC Vashi", alternateSource:"Crawford Market dry-fruit lanes", bulkNote:"Repack from 5-10 kg bags", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-007", shopCategory:"Grocery Shop", product:"Greek yoghurt", unit:"400 g tub", demandDriver:"Premium dairy growing 5-7% of consumption (web: SIAL Paris)", purchaseCost:70, sellingPrice:95, grossProfit:25, grossMarginPct:26.3, markupPct:35.7, profitRank:7, cheapestSource:"Dairy distributor (brand stockist)", alternateSource:"Cash & carry / quick-commerce dark store overflow", bulkNote:"Needs chilled storage; short shelf life", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-008", shopCategory:"Grocery Shop", product:"Oat / plant-based milk", unit:"1 L", demandDriver:"Plant-based milks popular with young professionals (web: SIAL Paris)", purchaseCost:140, sellingPrice:189, grossProfit:49, grossMarginPct:25.9, markupPct:35.0, profitRank:3, cheapestSource:"FMCG distributor / Udaan", alternateSource:"Importer-distributor (Mumbai)", bulkNote:"Carton of 6-12 for best rate", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-009", shopCategory:"Cafe", product:"Iced latte", unit:"1 serving (300 ml)", demandDriver:"Iced coffee is a year-round Mumbai seller (est.)", purchaseCost:42, sellingPrice:190, grossProfit:148, grossMarginPct:77.9, markupPct:352.4, profitRank:2, cheapestSource:"Local coffee roaster B2B (5-10 kg beans)", alternateSource:"Dairy distributor for milk; Udaan for consumables", bulkNote:"Cost = beans+milk+ice+cup", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-010", shopCategory:"Cafe", product:"Cold coffee (blended, Mumbai-style)", unit:"1 serving", demandDriver:"Perennial best-seller (est.)", purchaseCost:38, sellingPrice:160, grossProfit:122, grossMarginPct:76.3, markupPct:321.1, profitRank:4, cheapestSource:"Coffee/ice-cream premix wholesalers, Crawford Market", alternateSource:"Local dairy distributor", bulkNote:"Cost = premix+milk+ice cream", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-011", shopCategory:"Cafe", product:"Cappuccino", unit:"1 serving", demandDriver:"Core hot-menu item (est.)", purchaseCost:28, sellingPrice:140, grossProfit:112, grossMarginPct:80.0, markupPct:400.0, profitRank:5, cheapestSource:"Local coffee roaster B2B", alternateSource:"Dairy distributor", bulkNote:"Cost = beans+milk+cup", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-012", shopCategory:"Cafe", product:"Iced matcha latte", unit:"1 serving", demandDriver:"Matcha is a rising specialty drink (est.)", purchaseCost:55, sellingPrice:220, grossProfit:165, grossMarginPct:75.0, markupPct:300.0, profitRank:1, cheapestSource:"Specialty tea importer-distributor", alternateSource:"IndiaMART matcha suppliers", bulkNote:"Buy 500 g-1 kg tins", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-013", shopCategory:"Cafe", product:"Cold brew", unit:"250 ml bottle", demandDriver:"Ready-to-serve premium coffee (est.)", purchaseCost:45, sellingPrice:180, grossProfit:135, grossMarginPct:75.0, markupPct:300.0, profitRank:3, cheapestSource:"Local roaster (cold-brew grind)", alternateSource:"Self-brew in-house to cut cost", bulkNote:"Batch-brew; 7-10 day shelf life", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-014", shopCategory:"Cafe", product:"Bun maska (Irani-café style)", unit:"1 serving", demandDriver:"Iconic Mumbai café item; wholesale sweet pav ≈ ₹8/pc (web)", purchaseCost:14, sellingPrice:55, grossProfit:41, grossMarginPct:74.5, markupPct:292.9, profitRank:8, cheapestSource:"Local bakery wholesale (pav/bun) + butter from dairy distributor", alternateSource:"Daily bakery delivery", bulkNote:"Order fresh daily; low shelf life", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-015", shopCategory:"Cafe", product:"Grilled veg cheese sandwich", unit:"1 serving", demandDriver:"Quick-bite staple (est.)", purchaseCost:40, sellingPrice:150, grossProfit:110, grossMarginPct:73.3, markupPct:275.0, profitRank:6, cheapestSource:"Bread: local bakery; cheese/veg: APMC Vashi + dairy distributor", alternateSource:"Cash & carry", bulkNote:"Standardise portion to protect margin", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-016", shopCategory:"Cafe", product:"Chocolate brownie", unit:"1 piece", demandDriver:"Brownies/cookies are a growing café-bakery niche (web: bakery listings)", purchaseCost:28, sellingPrice:110, grossProfit:82, grossMarginPct:74.5, markupPct:292.9, profitRank:7, cheapestSource:"Bake in-house (cocoa/flour/butter from Masala Market/Crawford)", alternateSource:"Wholesale bakery supplier", bulkNote:"Batch-bake; 3-4 day shelf life", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-017", shopCategory:"Clothing Shop", product:"Oversized graphic T-shirt", unit:"1 piece", demandDriver:"Streetwear staple (est.)", purchaseCost:170, sellingPrice:499, grossProfit:329, grossMarginPct:65.9, markupPct:193.5, profitRank:8, cheapestSource:"Dadar wholesale market", alternateSource:"Tiruppur / Bhiwandi manufacturers", bulkNote:"Buy in size-sets of 20-50 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-018", shopCategory:"Clothing Shop", product:"Baggy / wide-leg jeans", unit:"1 piece", demandDriver:"Relaxed-fit denim trend (est.)", purchaseCost:480, sellingPrice:1299, grossProfit:819, grossMarginPct:63.0, markupPct:170.6, profitRank:2, cheapestSource:"Ulhasnagar denim manufacturers", alternateSource:"Dadar wholesale", bulkNote:"Minimum 12-24 pcs per design", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-019", shopCategory:"Clothing Shop", product:"Cargo trousers", unit:"1 piece", demandDriver:"Utility-style staple (est.)", purchaseCost:360, sellingPrice:999, grossProfit:639, grossMarginPct:64.0, markupPct:177.5, profitRank:4, cheapestSource:"Ulhasnagar / Dadar wholesale", alternateSource:"Bhiwandi manufacturers", bulkNote:"Size-set buying", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-020", shopCategory:"Clothing Shop", product:"Cotton kurti set (kurta+pant)", unit:"1 set", demandDriver:"Daily + office ethnic wear (est.)", purchaseCost:340, sellingPrice:899, grossProfit:559, grossMarginPct:62.2, markupPct:164.4, profitRank:6, cheapestSource:"Gandhi Market, Sion (women's fashion wholesale)", alternateSource:"Mangaldas / Hindmata Market", bulkNote:"Buy by design-set (6-12 sizes)", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-021", shopCategory:"Clothing Shop", product:"Co-ord set (women)", unit:"1 set", demandDriver:"Co-ord sets popular for casual/festive (est.)", purchaseCost:420, sellingPrice:1199, grossProfit:779, grossMarginPct:65.0, markupPct:185.5, profitRank:3, cheapestSource:"Gandhi Market, Sion", alternateSource:"Manish Market, Andheri", bulkNote:"Test 1 set/size before bulk", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-022", shopCategory:"Clothing Shop", product:"Linen-blend men's shirt", unit:"1 piece", demandDriver:"Summer/office casual (est.)", purchaseCost:330, sellingPrice:899, grossProfit:569, grossMarginPct:63.3, markupPct:172.4, profitRank:5, cheapestSource:"Dadar wholesale (shirt hub per web)", alternateSource:"Mangaldas Market / Crawford Market", bulkNote:"Buy 12-24 pcs/design", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-023", shopCategory:"Clothing Shop", product:"Joggers / track pants", unit:"1 piece", demandDriver:"Athleisure demand (est.)", purchaseCost:210, sellingPrice:599, grossProfit:389, grossMarginPct:64.9, markupPct:185.2, profitRank:7, cheapestSource:"Dadar wholesale", alternateSource:"Bhiwandi manufacturers", bulkNote:"Buy 24+ pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-024", shopCategory:"Clothing Shop", product:"Festive/wedding lehenga (ready-made)", unit:"1 piece", demandDriver:"Wedding & festive season demand (web: wedding markets)", purchaseCost:1400, sellingPrice:3499, grossProfit:2099, grossMarginPct:60.0, markupPct:149.9, profitRank:1, cheapestSource:"Bhuleshwar Market, Marine Lines", alternateSource:"Mangaldas / Juhu Tara Rd Market", bulkNote:"Buy ahead of Oct-Feb wedding season", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },

  { id:"MUM-025", shopCategory:"Furniture Shop", product:"Foldable study/work table", unit:"1 piece", demandDriver:"Work-from-home / small flats (est.)", purchaseCost:1800, sellingPrice:3200, grossProfit:1400, grossMarginPct:43.8, markupPct:77.8, profitRank:5, cheapestSource:"Lalbaug-Parel furniture cluster", alternateSource:"Bhiwandi/Vasai manufacturers; IndiaMART", bulkNote:"MOQ often 5-10 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-026", shopCategory:"Furniture Shop", product:"Engineered-wood shoe rack", unit:"1 piece", demandDriver:"Compact storage for small flats (est.)", purchaseCost:1400, sellingPrice:2500, grossProfit:1100, grossMarginPct:44.0, markupPct:78.6, profitRank:6, cheapestSource:"Bhiwandi/Vasai manufacturers", alternateSource:"Lalbaug-Parel cluster", bulkNote:"MOQ 5-10 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-027", shopCategory:"Furniture Shop", product:"Wall floating shelves (set of 3)", unit:"1 set", demandDriver:"Space-saving décor (est.)", purchaseCost:350, sellingPrice:799, grossProfit:449, grossMarginPct:56.2, markupPct:128.3, profitRank:8, cheapestSource:"Lalbaug-Parel cluster", alternateSource:"IndiaMART manufacturers", bulkNote:"Buy 20+ sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-028", shopCategory:"Furniture Shop", product:"Bean bag (filled, XXL)", unit:"1 piece", demandDriver:"Casual seating (est.)", purchaseCost:700, sellingPrice:1399, grossProfit:699, grossMarginPct:50.0, markupPct:99.9, profitRank:7, cheapestSource:"Local bean-bag manufacturers (Dharavi/Kurla)", alternateSource:"IndiaMART", bulkNote:"MOQ 10 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-029", shopCategory:"Furniture Shop", product:"Ergonomic office chair", unit:"1 piece", demandDriver:"Home-office demand (est.)", purchaseCost:2600, sellingPrice:4499, grossProfit:1899, grossMarginPct:42.2, markupPct:73.0, profitRank:4, cheapestSource:"Bhiwandi/Vasai manufacturers", alternateSource:"Lalbaug-Parel cluster", bulkNote:"MOQ 3-5 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-030", shopCategory:"Furniture Shop", product:"Sofa-cum-bed", unit:"1 piece", demandDriver:"Multi-use furniture for small homes (est.)", purchaseCost:9000, sellingPrice:15500, grossProfit:6500, grossMarginPct:41.9, markupPct:72.2, profitRank:2, cheapestSource:"Lalbaug-Parel cluster", alternateSource:"Bhiwandi manufacturers", bulkNote:"Often made-to-order", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-031", shopCategory:"Furniture Shop", product:"Hydraulic storage bed (queen)", unit:"1 piece", demandDriver:"Storage beds popular in Mumbai flats (est.)", purchaseCost:11000, sellingPrice:18500, grossProfit:7500, grossMarginPct:40.5, markupPct:68.2, profitRank:1, cheapestSource:"Bhiwandi/Vasai manufacturers", alternateSource:"Lalbaug-Parel cluster", bulkNote:"Made-to-order; deposit needed", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-032", shopCategory:"Furniture Shop", product:"Wooden TV unit", unit:"1 piece", demandDriver:"Living-room staple (est.)", purchaseCost:5500, sellingPrice:9500, grossProfit:4000, grossMarginPct:42.1, markupPct:72.7, profitRank:3, cheapestSource:"Lalbaug-Parel cluster", alternateSource:"Bhiwandi/Vasai manufacturers", bulkNote:"MOQ 2-3 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-033", shopCategory:"Pharmacy", product:"Paracetamol 650 mg (15 tabs)", unit:"1 strip", demandDriver:"Fever/pain OTC; price-controlled scheduled drug, retailer margin ≈16% (web)", purchaseCost:28, sellingPrice:33, grossProfit:5, grossMarginPct:15.2, markupPct:17.9, profitRank:7, cheapestSource:"Authorised pharma distributor/stockist", alternateSource:"Check via AIOCD member distributors", bulkNote:"Margin fixed by DPCO; volume drives profit", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-034", shopCategory:"Pharmacy", product:"ORS electrolyte powder", unit:"1 sachet", demandDriver:"Seasonal hydration demand (est.)", purchaseCost:16.8, sellingPrice:21, grossProfit:4.2, grossMarginPct:20.0, markupPct:25.0, profitRank:8, cheapestSource:"Authorised pharma distributor/stockist", alternateSource:"Chemist wholesalers", bulkNote:"Branded non-scheduled margin ≈20% (web)", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-035", shopCategory:"Pharmacy", product:"Vitamin D3 60,000 IU", unit:"1 pack (4 caps)", demandDriver:"High-volume prescription/OTC supplement (est.)", purchaseCost:109, sellingPrice:140, grossProfit:31, grossMarginPct:22.1, markupPct:28.4, profitRank:6, cheapestSource:"Authorised pharma distributor/stockist", alternateSource:"Company schemes via distributor", bulkNote:"Branded margin ≈20-25%", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-036", shopCategory:"Pharmacy", product:"Whey protein", unit:"1 kg tub", demandDriver:"Fitness-supplement demand at chemists (est.)", purchaseCost:2150, sellingPrice:2800, grossProfit:650, grossMarginPct:23.2, markupPct:30.2, profitRank:1, cheapestSource:"Brand distributor", alternateSource:"Authorised online B2B", bulkNote:"Buy during distributor schemes", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-037", shopCategory:"Pharmacy", product:"Omega-3 fish oil", unit:"60 caps", demandDriver:"Wellness supplement (est.)", purchaseCost:450, sellingPrice:600, grossProfit:150, grossMarginPct:25.0, markupPct:33.3, profitRank:3, cheapestSource:"Authorised pharma distributor/stockist", alternateSource:"Brand distributor", bulkNote:"Branded margin ≈25%", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-038", shopCategory:"Pharmacy", product:"SPF 50 sunscreen", unit:"50 g tube", demandDriver:"Skincare at pharmacies (est.)", purchaseCost:330, sellingPrice:450, grossProfit:120, grossMarginPct:26.7, markupPct:36.4, profitRank:4, cheapestSource:"Brand distributor / cosmetics stockist", alternateSource:"Authorised online B2B", bulkNote:"Margin ≈25-30%", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-039", shopCategory:"Pharmacy", product:"Digital thermometer", unit:"1 piece", demandDriver:"Evergreen home-health device (est.)", purchaseCost:140, sellingPrice:250, grossProfit:110, grossMarginPct:44.0, markupPct:78.6, profitRank:5, cheapestSource:"Medical-device wholesalers (Mumbai)", alternateSource:"IndiaMART", bulkNote:"Margin ≈40%+ on devices", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-040", shopCategory:"Pharmacy", product:"Glucose test strips", unit:"50 strips", demandDriver:"Chronic-care repeat purchase (est.)", purchaseCost:800, sellingPrice:1050, grossProfit:250, grossMarginPct:23.8, markupPct:31.3, profitRank:2, cheapestSource:"Brand distributor", alternateSource:"Authorised stockist", bulkNote:"Trade margin partly capped by NPPA", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-041", shopCategory:"Electronics Shop", product:"Portronics Twins S13 TWS earbuds", unit:"1 piece", demandDriver:"TWS earbuds are a top accessory; wholesale ₹605 (web)", purchaseCost:605, sellingPrice:999, grossProfit:394, grossMarginPct:39.4, markupPct:65.1, profitRank:3, cheapestSource:"Dot Com IT & Peripherals, Vashi Plaza (IndiaMART listing)", alternateSource:"Lamington Road wholesalers", bulkNote:"Buy 10+ pcs for better rate", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-042", shopCategory:"Electronics Shop", product:"Portronics Luxcell 10,000 mAh power bank", unit:"1 piece", demandDriver:"Power banks sell year-round; wholesale ₹727 (web)", purchaseCost:727, sellingPrice:1099, grossProfit:372, grossMarginPct:33.8, markupPct:51.2, profitRank:4, cheapestSource:"Dot Com IT & Peripherals, Vashi Plaza (IndiaMART listing)", alternateSource:"Lamington Road wholesalers", bulkNote:"Buy 10+ pcs", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-043", shopCategory:"Electronics Shop", product:"Printed phone case", unit:"1 piece", demandDriver:"Mumbai pop-culture/cricket cases are popular (web: Macmerise)", purchaseCost:40, sellingPrice:249, grossProfit:209, grossMarginPct:83.9, markupPct:522.5, profitRank:6, cheapestSource:"Lamington Road / Masjid area wholesalers", alternateSource:"Custom-print vendors", bulkNote:"Stock top 20 phone models only", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-044", shopCategory:"Electronics Shop", product:"33W fast charger", unit:"1 piece", demandDriver:"Fast-charging accessory (est.)", purchaseCost:240, sellingPrice:499, grossProfit:259, grossMarginPct:51.9, markupPct:107.9, profitRank:5, cheapestSource:"Lamington Road wholesalers", alternateSource:"Dot Com IT (Vashi)", bulkNote:"Prefer BIS-certified stock", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-045", shopCategory:"Electronics Shop", product:"Braided USB-C cable 1 m", unit:"1 piece", demandDriver:"High-turnover accessory (est.)", purchaseCost:55, sellingPrice:199, grossProfit:144, grossMarginPct:72.4, markupPct:261.8, profitRank:7, cheapestSource:"Lamington Road wholesalers", alternateSource:"Masjid / Falkland Road", bulkNote:"Buy 50-100 pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-046", shopCategory:"Electronics Shop", product:"Tempered glass (with fitting)", unit:"1 piece", demandDriver:"Add-on with every phone sale (est.)", purchaseCost:12, sellingPrice:99, grossProfit:87, grossMarginPct:87.9, markupPct:725.0, profitRank:8, cheapestSource:"Lamington Road wholesalers", alternateSource:"Masjid / Falkland Road", bulkNote:"Buy 100+ per model", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-047", shopCategory:"Electronics Shop", product:"Budget Bluetooth-calling smartwatch", unit:"1 piece", demandDriver:"Smart wearables sourced widely in Mumbai (web: anar.biz)", purchaseCost:850, sellingPrice:1499, grossProfit:649, grossMarginPct:43.3, markupPct:76.4, profitRank:1, cheapestSource:"Lamington Road wholesalers", alternateSource:"Falkland Road / Mumbai Central", bulkNote:"Check warranty/seller support", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-048", shopCategory:"Electronics Shop", product:"Portable Bluetooth speaker", unit:"1 piece", demandDriver:"Gifting + festive demand (est.)", purchaseCost:600, sellingPrice:1199, grossProfit:599, grossMarginPct:49.9, markupPct:99.8, profitRank:2, cheapestSource:"Lamington Road wholesalers", alternateSource:"Dot Com IT (Vashi)", bulkNote:"Festive stocking Oct-Nov", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-049", shopCategory:"Bakery", product:"Pav (ladi pav, pack of 6)", unit:"1 pack", demandDriver:"Mumbai staple; sweet pav ≈ ₹8/pc in wholesale listings (web)", purchaseCost:22, sellingPrice:30, grossProfit:8, grossMarginPct:26.7, markupPct:36.4, profitRank:7, cheapestSource:"Local bakery wholesale (Malad/Goregaon/Mulund per IndiaMART)", alternateSource:"Daily bakery delivery", bulkNote:"Order fresh daily", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-050", shopCategory:"Bakery", product:"Brun pav", unit:"1 piece", demandDriver:"Mumbai breakfast staple (est.)", purchaseCost:12, sellingPrice:20, grossProfit:8, grossMarginPct:40.0, markupPct:66.7, profitRank:7, cheapestSource:"Local bakery wholesale", alternateSource:"Make in-house", bulkNote:"Buy daily; low shelf life", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-051", shopCategory:"Bakery", product:"Whole-wheat/multigrain bread", unit:"400 g loaf", demandDriver:"Bread for quick-commerce is a bakery growth channel (web: SMERGERS)", purchaseCost:32, sellingPrice:48, grossProfit:16, grossMarginPct:33.3, markupPct:50.0, profitRank:6, cheapestSource:"Local bread manufacturers", alternateSource:"IndiaMART bakery suppliers", bulkNote:"Buy 50+ loaves/day for best rate", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-052", shopCategory:"Bakery", product:"Eggless chocolate truffle cake", unit:"500 g", demandDriver:"Premium eggless cakes are a growing segment (web: SMERGERS)", purchaseCost:230, sellingPrice:550, grossProfit:320, grossMarginPct:58.2, markupPct:139.1, profitRank:1, cheapestSource:"Bake in-house (ingredients: Masala Market/Crawford)", alternateSource:"Wholesale bakery supplier", bulkNote:"Cakes get best margins when customised", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-053", shopCategory:"Bakery", product:"Cookie box (6 pcs)", unit:"1 box", demandDriver:"Cookie/brownie niche growing (web: SMERGERS)", purchaseCost:90, sellingPrice:250, grossProfit:160, grossMarginPct:64.0, markupPct:177.8, profitRank:2, cheapestSource:"Bake in-house", alternateSource:"Bulk cookies from local bakers", bulkNote:"Packaging is 10-15% of cost", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-054", shopCategory:"Bakery", product:"Brownie", unit:"1 piece", demandDriver:"Brownie cafés are a local trend (web: SMERGERS)", purchaseCost:28, sellingPrice:90, grossProfit:62, grossMarginPct:68.9, markupPct:221.4, profitRank:3, cheapestSource:"Bake in-house", alternateSource:"Wholesale bakery supplier", bulkNote:"Batch-bake", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-055", shopCategory:"Bakery", product:"Osmania / khari biscuits", unit:"250 g", demandDriver:"Traditional tea-time seller (est.)", purchaseCost:45, sellingPrice:75, grossProfit:30, grossMarginPct:40.0, markupPct:66.7, profitRank:5, cheapestSource:"Local biscuit wholesalers (Dadar/Lalbaug)", alternateSource:"Bakery wholesale", bulkNote:"Buy 10-20 kg cartons", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-056", shopCategory:"Bakery", product:"Cupcake", unit:"1 piece", demandDriver:"Birthday/party orders (est.)", purchaseCost:22, sellingPrice:60, grossProfit:38, grossMarginPct:63.3, markupPct:172.7, profitRank:4, cheapestSource:"Bake in-house", alternateSource:"Wholesale bakery supplier", bulkNote:"Same-day sale preferred", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-057", shopCategory:"Restaurant", product:"Vada pav", unit:"1 piece", demandDriver:"Iconic Mumbai street food (est.)", purchaseCost:11, sellingPrice:25, grossProfit:14, grossMarginPct:56.0, markupPct:127.3, profitRank:8, cheapestSource:"Vegetables/potatoes: APMC Vashi (Kanda-Batata market)", alternateSource:"Local bakery for pav", bulkNote:"Source potatoes in 50 kg sacks", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-058", shopCategory:"Restaurant", product:"Pav bhaji", unit:"1 plate (2 pav)", demandDriver:"Mumbai all-time favourite (est.)", purchaseCost:55, sellingPrice:190, grossProfit:135, grossMarginPct:71.1, markupPct:245.5, profitRank:4, cheapestSource:"Vegetables: APMC Vashi", alternateSource:"Butter from dairy distributor", bulkNote:"Buy veg early morning (4-8 AM)", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-059", shopCategory:"Restaurant", product:"Chicken dum biryani", unit:"1 plate", demandDriver:"Delivery-app favourite (est.)", purchaseCost:120, sellingPrice:320, grossProfit:200, grossMarginPct:62.5, markupPct:166.7, profitRank:2, cheapestSource:"Chicken: local wholesale poultry; rice/spices: APMC Vashi Masala Market", alternateSource:"Hyperpure / Udaan B2B", bulkNote:"Buy rice in 25-50 kg bags", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-060", shopCategory:"Restaurant", product:"Paneer tikka", unit:"6 pieces", demandDriver:"Popular starter (est.)", purchaseCost:85, sellingPrice:280, grossProfit:195, grossMarginPct:69.6, markupPct:229.4, profitRank:3, cheapestSource:"Paneer: dairy distributor", alternateSource:"APMC Vashi for veg", bulkNote:"Buy paneer in 5-10 kg blocks", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-061", shopCategory:"Restaurant", product:"Butter chicken", unit:"Half plate", demandDriver:"Popular main course (est.)", purchaseCost:130, sellingPrice:380, grossProfit:250, grossMarginPct:65.8, markupPct:192.3, profitRank:1, cheapestSource:"Chicken: wholesale poultry", alternateSource:"Hyperpure / Udaan B2B", bulkNote:"Standardise gravy base", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-062", shopCategory:"Restaurant", product:"Steamed momos", unit:"6 pieces", demandDriver:"Quick-bite delivery favourite (est.)", purchaseCost:30, sellingPrice:120, grossProfit:90, grossMarginPct:75.0, markupPct:300.0, profitRank:7, cheapestSource:"Make in-house (flour/veg from APMC)", alternateSource:"Frozen momo wholesalers", bulkNote:"Batch-prepare fillings", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-063", shopCategory:"Restaurant", product:"Veg schezwan hakka noodles", unit:"1 plate", demandDriver:"Indo-Chinese staple (est.)", purchaseCost:35, sellingPrice:160, grossProfit:125, grossMarginPct:78.1, markupPct:357.1, profitRank:6, cheapestSource:"Noodles: Masala Market/Udaan; veg: APMC Vashi", alternateSource:"Cash & carry", bulkNote:"Buy sauces in bulk tins", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-064", shopCategory:"Restaurant", product:"Cheese schezwan dosa", unit:"1 piece", demandDriver:"Fusion dosa popular in Mumbai (est.)", purchaseCost:40, sellingPrice:170, grossProfit:130, grossMarginPct:76.5, markupPct:325.0, profitRank:5, cheapestSource:"Batter in-house; cheese from dairy distributor", alternateSource:"Cash & carry", bulkNote:"Standardise cheese quantity", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-065", shopCategory:"Bookstore", product:"Atomic Habits (James Clear)", unit:"1 copy", demandDriver:"Perennial self-help bestseller (est.)", purchaseCost:375, sellingPrice:599, grossProfit:224, grossMarginPct:37.4, markupPct:59.7, profitRank:1, cheapestSource:"Publisher distributor (Penguin Random House India)", alternateSource:"Mumbai book wholesalers (Fort/Kalbadevi) – verify", bulkNote:"Trade discount ≈35-40% off MRP", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-066", shopCategory:"Bookstore", product:"The Psychology of Money", unit:"1 copy", demandDriver:"Evergreen finance bestseller (est.)", purchaseCost:245, sellingPrice:399, grossProfit:154, grossMarginPct:38.6, markupPct:62.9, profitRank:4, cheapestSource:"Publisher distributor (Jaico)", alternateSource:"Mumbai book wholesalers – verify", bulkNote:"Trade discount ≈35-40% off MRP", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-067", shopCategory:"Bookstore", product:"Rich Dad Poor Dad", unit:"1 copy", demandDriver:"Evergreen finance bestseller (est.)", purchaseCost:240, sellingPrice:399, grossProfit:159, grossMarginPct:39.8, markupPct:66.3, profitRank:3, cheapestSource:"Publisher distributor", alternateSource:"Mumbai book wholesalers – verify", bulkNote:"Trade discount ≈35-40% off MRP", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-068", shopCategory:"Bookstore", product:"Ikigai", unit:"1 copy", demandDriver:"Evergreen self-help (est.)", purchaseCost:215, sellingPrice:350, grossProfit:135, grossMarginPct:38.6, markupPct:62.8, profitRank:5, cheapestSource:"Publisher distributor", alternateSource:"Mumbai book wholesalers – verify", bulkNote:"Trade discount ≈35-40% off MRP", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-069", shopCategory:"Bookstore", product:"It Ends With Us (Colleen Hoover)", unit:"1 copy", demandDriver:"Popular fiction among young readers (est.)", purchaseCost:300, sellingPrice:499, grossProfit:199, grossMarginPct:39.9, markupPct:66.3, profitRank:2, cheapestSource:"Publisher distributor", alternateSource:"Mumbai book wholesalers – verify", bulkNote:"Trade discount ≈35-40% off MRP", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-070", shopCategory:"Bookstore", product:"Dotted A5 journal", unit:"1 piece", demandDriver:"Journaling/stationery trend (est.)", purchaseCost:120, sellingPrice:249, grossProfit:129, grossMarginPct:51.8, markupPct:107.5, profitRank:6, cheapestSource:"Kalbadevi stationery wholesalers – verify", alternateSource:"IndiaMART", bulkNote:"Buy 20+ pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-071", shopCategory:"Bookstore", product:"Gel pen pack (10)", unit:"1 pack", demandDriver:"Student stationery (est.)", purchaseCost:70, sellingPrice:130, grossProfit:60, grossMarginPct:46.2, markupPct:85.7, profitRank:8, cheapestSource:"Stationery wholesalers (Kalbadevi/Masjid) – verify", alternateSource:"IndiaMART", bulkNote:"Buy by carton", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-072", shopCategory:"Bookstore", product:"Sketch pens (24 colours)", unit:"1 set", demandDriver:"Kids/hobby art demand (est.)", purchaseCost:110, sellingPrice:220, grossProfit:110, grossMarginPct:50.0, markupPct:100.0, profitRank:7, cheapestSource:"Stationery wholesalers – verify", alternateSource:"IndiaMART", bulkNote:"Buy by carton", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-073", shopCategory:"Beauty Salon", product:"Hair smoothening / keratin", unit:"1 service", demandDriver:"High-ticket hair service (est.)", purchaseCost:900, sellingPrice:5000, grossProfit:4100, grossMarginPct:82.0, markupPct:455.6, profitRank:1, cheapestSource:"Pro-brand distributors (L'Oréal Pro/Matrix etc.)", alternateSource:"Crawford Market wholesale beauty lanes", bulkNote:"Cost = product per full-length service", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-074", shopCategory:"Beauty Salon", product:"Hair spa", unit:"1 service", demandDriver:"Repeat service (est.)", purchaseCost:150, sellingPrice:1200, grossProfit:1050, grossMarginPct:87.5, markupPct:700.0, profitRank:7, cheapestSource:"Pro-brand distributors", alternateSource:"Crawford Market wholesale", bulkNote:"Buy 1 kg+ tubs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-075", shopCategory:"Beauty Salon", product:"Global hair colour", unit:"1 service", demandDriver:"Colour services increasingly popular (est.)", purchaseCost:350, sellingPrice:2500, grossProfit:2150, grossMarginPct:86.0, markupPct:614.3, profitRank:3, cheapestSource:"Pro-brand distributors", alternateSource:"Crawford Market wholesale", bulkNote:"Buy colour tubes in 6-12 sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-076", shopCategory:"Beauty Salon", product:"Classic facial", unit:"1 service", demandDriver:"Core salon service (est.)", purchaseCost:180, sellingPrice:1500, grossProfit:1320, grossMarginPct:88.0, markupPct:733.3, profitRank:5, cheapestSource:"Facial-kit distributors", alternateSource:"Crawford Market wholesale", bulkNote:"Buy multi-use kits", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-077", shopCategory:"Beauty Salon", product:"HydraFacial-type facial", unit:"1 service", demandDriver:"Premium skin treatment (est.)", purchaseCost:700, sellingPrice:4000, grossProfit:3300, grossMarginPct:82.5, markupPct:471.4, profitRank:2, cheapestSource:"Machine/consumable distributors", alternateSource:"IndiaMART suppliers", bulkNote:"Consumable cartridges recurring cost", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-078", shopCategory:"Beauty Salon", product:"Gel nail extensions", unit:"1 service", demandDriver:"Nail art demand (est.)", purchaseCost:220, sellingPrice:1500, grossProfit:1280, grossMarginPct:85.3, markupPct:581.8, profitRank:6, cheapestSource:"Nail-product wholesalers, Crawford Market", alternateSource:"IndiaMART", bulkNote:"Buy gel/tips in bulk", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-079", shopCategory:"Beauty Salon", product:"Manicure + pedicure", unit:"1 service", demandDriver:"Repeat service (est.)", purchaseCost:120, sellingPrice:900, grossProfit:780, grossMarginPct:86.7, markupPct:650.0, profitRank:8, cheapestSource:"Crawford Market wholesale", alternateSource:"Pro-brand distributors", bulkNote:"Disposable kits cut cost", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-080", shopCategory:"Beauty Salon", product:"Lash lift", unit:"1 service", demandDriver:"Low-cost, high-margin add-on (est.)", purchaseCost:250, sellingPrice:1800, grossProfit:1550, grossMarginPct:86.1, markupPct:620.0, profitRank:4, cheapestSource:"Lash-kit distributors", alternateSource:"IndiaMART", bulkNote:"Training certificate needed", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-081", shopCategory:"Jewellery Shop", product:"22K plain gold chain", unit:"1 gram", demandDriver:"Gold demand strong; 22K ≈ ₹13,700/g in Oct 2026 (web)", purchaseCost:13974, sellingPrice:15070, grossProfit:1096, grossMarginPct:7.3, markupPct:7.8, profitRank:3, cheapestSource:"Zaveri Bazaar wholesalers/karigars", alternateSource:"Bank/MMTC rate-linked bullion dealers", bulkNote:"Purchase = gold + ~2% making; retail adds ~10% making (GST 3% extra)", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-082", shopCategory:"Jewellery Shop", product:"22K gold bangles", unit:"1 gram", demandDriver:"Wedding/festive season demand (web)", purchaseCost:14042.5, sellingPrice:15344, grossProfit:1301.5, grossMarginPct:8.5, markupPct:9.3, profitRank:2, cheapestSource:"Zaveri Bazaar wholesalers/karigars", alternateSource:"Bhuleshwar/Zaveri karigars", bulkNote:"Hallmark (BIS HUID) mandatory", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-083", shopCategory:"Jewellery Shop", product:"22K light-weight earrings", unit:"1 gram", demandDriver:"Light-weight daily-wear gold trend (est.)", purchaseCost:14111, sellingPrice:15618, grossProfit:1507, grossMarginPct:9.6, markupPct:10.7, profitRank:1, cheapestSource:"Zaveri Bazaar wholesalers", alternateSource:"Karigars (Kalbadevi)", bulkNote:"Lower tickets sell faster", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-084", shopCategory:"Jewellery Shop", product:"24K gold coin", unit:"1 gram", demandDriver:"Festive/investment coins (est.)", purchaseCost:15049.44, sellingPrice:15377.9, grossProfit:328.46, grossMarginPct:2.1, markupPct:2.2, profitRank:7, cheapestSource:"Bullion dealers, Zaveri Bazaar", alternateSource:"Bank/MMTC", bulkNote:"Thin margin; high volume", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-085", shopCategory:"Jewellery Shop", product:"18K light-weight pendant", unit:"1 gram", demandDriver:"18K lightweight jewellery is trending (est.)", purchaseCost:11480, sellingPrice:12544, grossProfit:1064, grossMarginPct:8.5, markupPct:9.3, profitRank:4, cheapestSource:"Zaveri Bazaar wholesalers", alternateSource:"Karigars", bulkNote:"Good for younger buyers", priceBasis:"Web-anchored", confidence:"Medium", dataAsOf:"19-Oct-2026" },
  { id:"MUM-086", shopCategory:"Jewellery Shop", product:"American Diamond necklace set", unit:"1 set", demandDriver:"Wedding/party wear (est.)", purchaseCost:450, sellingPrice:1299, grossProfit:849, grossMarginPct:65.4, markupPct:188.7, profitRank:5, cheapestSource:"Bhuleshwar Market / Chira Bazaar", alternateSource:"Crawford Market", bulkNote:"Buy 6-12 designs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-087", shopCategory:"Jewellery Shop", product:"Oxidised jhumka (pair)", unit:"1 pair", demandDriver:"Fashion jewellery best-seller (est.)", purchaseCost:35, sellingPrice:199, grossProfit:164, grossMarginPct:82.4, markupPct:468.6, profitRank:8, cheapestSource:"Crawford Market / Bhuleshwar Market", alternateSource:"Lamington Road", bulkNote:"Buy 24+ pairs per design", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-088", shopCategory:"Jewellery Shop", product:"Kundan choker set", unit:"1 set", demandDriver:"Wedding season demand (est.)", purchaseCost:380, sellingPrice:999, grossProfit:619, grossMarginPct:62.0, markupPct:162.9, profitRank:6, cheapestSource:"Bhuleshwar Market / Chira Bazaar", alternateSource:"Crawford Market", bulkNote:"Stock before wedding season", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },

  { id:"MUM-089", shopCategory:"Toy Shop", product:"Building blocks set (500 pcs)", unit:"1 set", demandDriver:"STEM/educational toy demand (est.)", purchaseCost:320, sellingPrice:799, grossProfit:479, grossMarginPct:59.9, markupPct:149.7, profitRank:2, cheapestSource:"Crawford Market toy lanes", alternateSource:"Manish Market, Andheri", bulkNote:"Buy 6-12 sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-090", shopCategory:"Toy Shop", product:"Remote-control stunt car", unit:"1 piece", demandDriver:"Gifting favourite (est.)", purchaseCost:380, sellingPrice:999, grossProfit:619, grossMarginPct:62.0, markupPct:162.9, profitRank:1, cheapestSource:"Crawford Market toy lanes", alternateSource:"Manish Market, Andheri", bulkNote:"Check batteries/charger", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-091", shopCategory:"Toy Shop", product:"Die-cast toy cars (pack of 5)", unit:"1 pack", demandDriver:"Collectible-style toy (est.)", purchaseCost:180, sellingPrice:449, grossProfit:269, grossMarginPct:59.9, markupPct:149.4, profitRank:5, cheapestSource:"Crawford Market toy lanes", alternateSource:"Bhiwandi toy warehouses", bulkNote:"Buy by carton", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-092", shopCategory:"Toy Shop", product:"Plush teddy 2 ft", unit:"1 piece", demandDriver:"Gifting staple (est.)", purchaseCost:220, sellingPrice:599, grossProfit:379, grossMarginPct:63.3, markupPct:172.3, profitRank:4, cheapestSource:"Crawford Market / Dharavi plush makers", alternateSource:"Bhiwandi warehouses", bulkNote:"Buy 10+ pcs", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-093", shopCategory:"Toy Shop", product:"Wooden alphabet/puzzle set", unit:"1 set", demandDriver:"Learning toys for toddlers (est.)", purchaseCost:90, sellingPrice:249, grossProfit:159, grossMarginPct:63.9, markupPct:176.7, profitRank:7, cheapestSource:"Crawford Market toy lanes", alternateSource:"IndiaMART", bulkNote:"Buy 20+ sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-094", shopCategory:"Toy Shop", product:"Pop-it / fidget & squishy set", unit:"1 set", demandDriver:"Impulse-buy kids item (est.)", purchaseCost:25, sellingPrice:99, grossProfit:74, grossMarginPct:74.7, markupPct:296.0, profitRank:8, cheapestSource:"Crawford Market / Masjid Bunder", alternateSource:"Manish Market", bulkNote:"Buy 50+ sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-095", shopCategory:"Toy Shop", product:"Family board game (Ludo/business)", unit:"1 piece", demandDriver:"Festive & family gifting (est.)", purchaseCost:140, sellingPrice:349, grossProfit:209, grossMarginPct:59.9, markupPct:149.3, profitRank:6, cheapestSource:"Crawford Market", alternateSource:"Manish Market", bulkNote:"Stock before Diwali", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
  { id:"MUM-096", shopCategory:"Toy Shop", product:"Kitchen role-play set", unit:"1 set", demandDriver:"Pretend-play toys (est.)", purchaseCost:300, sellingPrice:749, grossProfit:449, grossMarginPct:59.9, markupPct:149.7, profitRank:3, cheapestSource:"Crawford Market toy lanes", alternateSource:"Bhiwandi warehouses", bulkNote:"Buy 6-12 sets", priceBasis:"Estimate", confidence:"Low", dataAsOf:"19-Oct-2026" },
];

const SHOP_TYPES = [
  "Grocery Shop","Cafe","Clothing Shop","Furniture Shop",
  "Pharmacy","Electronics Shop","Bakery","Restaurant",
  "Bookstore","Beauty Salon","Jewellery Shop","Toy Shop",
];

const SHOP_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Grocery Shop":    <ShoppingCart className="h-5 w-5" />,
  "Cafe":            <BookOpen className="h-5 w-5" />,
  "Clothing Shop":   <Tag className="h-5 w-5" />,
  "Furniture Shop":  <Layers className="h-5 w-5" />,
  "Pharmacy":        <Plus className="h-5 w-5" />,
  "Electronics Shop":<BarChart3 className="h-5 w-5" />,
  "Bakery":          <Package className="h-5 w-5" />,
  "Restaurant":      <IndianRupee className="h-5 w-5" />,
  "Bookstore":       <BookOpen className="h-5 w-5" />,
  "Beauty Salon":    <Sparkles className="h-5 w-5" />,
  "Jewellery Shop":  <BadgeCheck className="h-5 w-5" />,
  "Toy Shop":        <Package className="h-5 w-5" />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const pct = (n: number) => n.toFixed(1) + "%";

function confidenceBadge(c: string) {
  if (c === "High")   return "bg-emerald-500/10 text-emerald-400 border-emerald-400/30";
  if (c === "Medium") return "bg-blue-500/10 text-blue-400 border-blue-400/30";
  return "bg-slate-500/10 text-slate-400 border-slate-400/30";
}
function basisBadge(b: string) {
  if (b === "Web-anchored") return "bg-violet-500/10 text-violet-400 border-violet-400/30";
  return "bg-amber-500/10 text-amber-400 border-amber-400/30";
}

// ── Saved/tracked state (localStorage mock) ──────────────────────────────────
const SAVED_KEY = "trackify.trending.saved";
function loadSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function toggleSaved(id: string): string[] {
  const s = loadSaved();
  const next = s.includes(id) ? s.filter(x => x !== id) : [...s, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

// ── "Should I Buy This?" panel ────────────────────────────────────────────────
function BuyPanel({ item, onClose }: { item: TrendItem; onClose: () => void }) {
  const { t } = useI18n();
  const [purchase, setPurchase]   = useState(item.purchaseCost.toString());
  const [selling,  setSelling]    = useState(item.sellingPrice.toString());
  const [qty,      setQty]        = useState("10");
  const [budget,   setBudget]     = useState("");

  const pBuy     = parseFloat(purchase) || 0;
  const pSell    = parseFloat(selling)  || 0;
  const pQty     = parseInt(qty)         || 0;
  const pBudget  = parseFloat(budget)   || 0;

  const profitPerUnit   = pSell - pBuy;
  const marginPct       = pSell > 0 ? (profitPerUnit / pSell) * 100 : 0;
  const investment      = pBuy * pQty;
  const potentialProfit = profitPerUnit * pQty;

  const hasBudget   = budget.trim() !== "" && pBudget > 0;
  const budgetFits  = hasBudget && investment <= pBudget;
  const isHighRisk  = (hasBudget && investment > pBudget) || marginPct <= 0;
  const isCheckBefore = item.confidence === "Low" || item.priceBasis === "Estimate";
  const isSmallTrial  = budgetFits && marginPct > 0 && item.confidence === "Medium" && item.priceBasis === "Web-anchored";

  // Suggested trial qty
  const shortShelf = /shelf life|fresh|daily|batch/i.test(item.bulkNote);
  let trialQty = 10;
  if (hasBudget && pBuy > 0) trialQty = Math.min(Math.floor(pBudget / pBuy), 10);
  if (shortShelf) trialQty = Math.min(trialQty, 3);

  let recBadge = { label: "Check before buying", color: "bg-amber-500/10 text-amber-400 border-amber-400/30", icon: <HelpCircle className="h-4 w-4" /> };
  let recReason = "Price basis is Estimate or confidence is Low — verify with your supplier first.";
  if (isHighRisk) {
    recBadge  = { label: "High financial risk", color: "bg-red-500/10 text-red-400 border-red-400/30", icon: <AlertTriangle className="h-4 w-4" /> };
    recReason = investment > pBudget ? "Investment exceeds your budget." : marginPct <= 0 ? "Selling price is at or below purchase cost." : "Review pricing before buying.";
  } else if (isSmallTrial) {
    recBadge  = { label: "Consider a small trial", color: "bg-emerald-500/10 text-emerald-400 border-emerald-400/30", icon: <CheckCircle className="h-4 w-4" /> };
    recReason = "Investment fits budget, margin is positive, and the price has a web reference. Start with a small trial.";
  }

  const sellMissing  = pSell <= 0 && selling.trim() !== "";
  const buyInvalid   = pBuy  <= 0 && purchase.trim() !== "";
  const qtyInvalid   = pQty  <  0;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0 text-primary">
              {SHOP_CATEGORY_ICONS[item.shopCategory] || <Package className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t("should_i_buy", "trending", "Should I Buy This?")}</p>
              <h2 className="font-bold text-base leading-tight mt-0.5">{item.product}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{item.unit} · {item.shopCategory}</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Estimate tag */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{t("sample_estimate_warning", "trending", "Prices below are sample estimates from the CSV (19-Oct-2026). Always verify with your supplier.")}</span>
          </div>

          {/* CSV snapshot */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: t("buy", "trending", "Buy Price"), value: fmt(item.purchaseCost) },
              { label: t("sell", "trending", "Sell Price"), value: fmt(item.sellingPrice) },
              { label: t("profit_unit", "trending", "Gross Profit"), value: fmt(item.grossProfit) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className="font-bold text-base">{value}</div>
              </div>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("your_numbers", "trending", "Your numbers")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("purchase_price", "trending", "Purchase price")} / {item.unit}</Label>
                <Input value={purchase} onChange={e => setPurchase(e.target.value)} type="number" min="0.01" step="any" className="h-10" />
                {buyInvalid && <p className="text-xs text-destructive">Enter a valid purchase price</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("selling_price", "trending", "Selling price")} / {item.unit}</Label>
                <Input value={selling} onChange={e => setSelling(e.target.value)} type="number" min="0" step="any" className="h-10" />
                {sellMissing && <p className="text-xs text-destructive">Enter selling price</p>}
                {!sellMissing && pSell === 0 && <p className="text-xs text-muted-foreground">Enter selling price to see margin</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("quantity_to_buy", "trending", "Quantity to buy")}</Label>
                <Input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" step="1" className="h-10" />
                {qtyInvalid && <p className="text-xs text-destructive">Quantity cannot be negative</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("your_budget", "trending", "Your budget (₹)")}</Label>
                <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 5000" type="number" min="0" step="any" className="h-10" />
                {!hasBudget && <p className="text-xs text-muted-foreground">Add your budget to check fit</p>}
              </div>
            </div>
          </div>

          {/* Calculations */}
          {pBuy > 0 && pSell > 0 && pQty > 0 && (
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold">Calculations</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Gross profit / unit</span>
                <span className={`font-semibold text-right ${profitPerUnit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(profitPerUnit)}</span>
                <span className="text-muted-foreground">Gross margin</span>
                <span className="font-semibold text-right">{pSell > 0 ? pct(marginPct) : "—"}</span>
                <span className="text-muted-foreground">Total investment</span>
                <span className={`font-semibold text-right ${hasBudget && investment > pBudget ? "text-red-400" : ""}`}>{fmt(investment)}</span>
                <span className="text-muted-foreground">Potential gross profit</span>
                <span className="font-semibold text-right text-muted-foreground">{fmt(potentialProfit)} <span className="text-xs font-normal">(if all sell)</span></span>
              </div>
              {hasBudget && (
                <div className={`text-xs rounded-lg px-3 py-2 mt-1 ${budgetFits ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {budgetFits
                    ? `Fits within your ₹${pBudget.toLocaleString("en-IN")} budget.`
                    : `Exceeds budget by ${fmt(investment - pBudget)}.`}
                </div>
              )}
            </div>
          )}

          {/* Suggested trial */}
          {pBuy > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <p className="font-medium text-primary mb-1">{t("suggested_trial", "trending", "Suggested trial quantity")}</p>
              <p className="text-2xl font-bold">{trialQty} {trialQty === 1 ? "unit" : "units"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cautious starting estimate — not a prediction. {shortShelf && "Short shelf life noted; start very small."}
              </p>
            </div>
          )}

          {/* Recommendation */}
          <div className={`border rounded-xl p-4 space-y-2 ${recBadge.color}`}>
            <div className="flex items-center gap-2 font-semibold text-sm">
              {recBadge.icon}
              {recBadge.label}
            </div>
            <p className="text-xs">{recReason}</p>
            <p className="text-xs text-muted-foreground">This is not a guarantee of sales or profit.</p>
          </div>

          {/* Evidence */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("evidence", "trending", "Evidence")}</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Demand driver",  value: item.demandDriver },
                { label: "Price basis",    value: item.priceBasis },
                { label: "Confidence",     value: item.confidence },
                { label: "Data as of",     value: item.dataAsOf },
                { label: "Cheapest source",value: item.cheapestSource },
                { label: "Alternate source",value: item.alternateSource },
                { label: "Bulk note",      value: item.bulkNote },
                { label: "Sources",        value: "1 (CSV — no external link)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">{label}</span>
                  <span className="text-foreground/80 leading-snug">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <Button onClick={onClose} className="w-full bg-gradient-primary font-semibold">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("back_to_list", "trending", "Back to list")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sparkles icon (inline to avoid import conflict) ──────────────────────────
function Sparkles({ className }: { className?: string }) {
  return <TrendingUp className={className} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Trending() {
  const { location, shopCategory, setLocation, setShopCategory } = usePreferences();
  const { t, tCategory } = useI18n();

  const [locationInput, setLocationInput] = useState(location || "");
  const [shopInput,     setShopInput]     = useState(shopCategory || "");
  const [showDrop,      setShowDrop]      = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [results,       setResults]       = useState<TrendItem[]>([]);
  const [hasSearched,   setHasSearched]   = useState(false);
  const [selected,      setSelected]      = useState<TrendItem | null>(null);
  const [saved,         setSaved]         = useState<string[]>(loadSaved);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-load if previously saved
  useEffect(() => {
    if (shopCategory) doSearch(shopCategory);
  }, []);

  function doSearch(cat: string) {
    const filtered = TRENDS.filter(t => t.shopCategory === cat).sort((a, b) => a.profitRank - b.profitRank);
    setResults(filtered);
    setHasSearched(true);
    setSearchQuery("");
  }

  function handleSearch() {
    if (!shopInput.trim()) return;
    setLocation(locationInput.trim() || "Mumbai");
    setShopCategory(shopInput);
    doSearch(shopInput);
  }

  function handleSave(id: string) { setSaved(toggleSaved(id)); }

  const filteredShops = SHOP_TYPES.filter(s => s.toLowerCase().includes(shopInput.toLowerCase()));

  const displayed = searchQuery
    ? results.filter(r => r.product.toLowerCase().includes(searchQuery.toLowerCase()) || r.unit.toLowerCase().includes(searchQuery.toLowerCase()))
    : results;

  // Stats from CSV
  const totalProducts   = results.length;
  const bestMargin      = results.length ? Math.max(...results.map(r => r.grossMarginPct)) : 0;
  const webAnchored     = results.filter(r => r.priceBasis === "Web-anchored").length;

  return (
    <>
      {selected && <BuyPanel item={selected} onClose={() => setSelected(null)} />}

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('title', 'trending', 'Trending Items')}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t('subtitle', 'trending', 'Product candidates and market demand insights')}
            </p>
          </div>
          {hasSearched && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-border">
              <MapPin className="h-3.5 w-3.5" />
              {location || "Mumbai"}
            </Badge>
          )}
        </div>

        {/* Setup card */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Store className="h-5 w-5 text-primary" />
              {t("what_shop_own", "trending", "What type of shop do you own?")}
            </CardTitle>
            <CardDescription>{t("select_shop_type", "trending", "Select your shop type to see products sorted by profit rank")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Location */}
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("city_placeholder", "trending", "Your city (e.g. Mumbai)")}
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>

              {/* Shop type */}
              <div className="relative flex-1" ref={dropRef}>
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder={t("shop_placeholder", "trending", "e.g. Grocery, Cafe, Pharmacy")}
                  value={shopInput}
                  onFocus={() => setShowDrop(true)}
                  onChange={e => { setShopInput(e.target.value); setShowDrop(true); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="pl-9 pr-8"
                />
                {shopInput && (
                  <button onClick={() => { setShopInput(""); setShowDrop(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {showDrop && filteredShops.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                      {filteredShops.map(shop => (
                        <button key={shop} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-muted/70 transition-colors text-sm" onMouseDown={() => { setShopInput(shop); setShowDrop(false); }}>
                          <span className="text-primary">{SHOP_CATEGORY_ICONS[shop]}</span>
                          {shop}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button className="bg-gradient-primary font-semibold gap-2 shrink-0" onClick={handleSearch} disabled={!shopInput.trim()}>
                {t("find_trending_items", "trending", "Find Trending Items")}
              </Button>
            </div>

            {/* Shop chips */}
            <div className="flex flex-wrap gap-2">
              {SHOP_TYPES.map(s => (
                <button key={s}
                  onClick={() => { setShopInput(s); setShowDrop(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    shopInput === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                  }`}>
                  <span className={shopInput === s ? "text-primary-foreground" : "text-primary"}>
                    {SHOP_CATEGORY_ICONS[s]}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && results.length > 0 && (
          <>
            {/* Stat cards — only show if value > 0 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {totalProducts > 0 && (
                <Card className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                    <div>
                      <div className="text-2xl font-bold">{totalProducts}</div>
                      <div className="text-xs text-muted-foreground">{t("products_in_category", "trending", "Products in category")}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {bestMargin > 0 && (
                <Card className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-500/10"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
                    <div>
                      <div className="text-2xl font-bold">{pct(bestMargin)}</div>
                      <div className="text-xs text-muted-foreground">{t("best_gross_margin", "trending", "Best gross margin")}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {webAnchored > 0 && (
                <Card className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-violet-500/10"><Link2 className="h-5 w-5 text-violet-400" /></div>
                    <div>
                      <div className="text-2xl font-bold">{webAnchored}</div>
                      <div className="text-xs text-muted-foreground">{t("web_anchored_prices", "trending", "Web-anchored prices")}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* List header + search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-primary">{SHOP_CATEGORY_ICONS[shopInput] || <Package className="h-5 w-5" />}</span>
                <div>
                  <h2 className="font-semibold text-lg">{shopInput}</h2>
                  <p className="text-xs text-muted-foreground">{location || "Mumbai"} · {results.length} products · sorted by profit rank</p>
                </div>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("filter_products", "trending", "Filter products...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
              </div>
            </div>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(item => {
                const isSaved = saved.includes(item.id);
                return (
                  <Card key={item.id} className="shadow-card hover:shadow-lg transition-shadow border-l-4 border-l-primary/30 cursor-pointer group"
                    onClick={() => setSelected(item)}>
                    <CardContent className="p-4 space-y-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-muted-foreground">#{item.profitRank}</span>
                          </div>
                          <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{item.product}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.unit}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleSave(item.id); }}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${isSaved ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                          title={isSaved ? "Saved" : "Save for later"}
                        >
                          <BookOpen className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Prices */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/40 rounded-lg py-2">
                          <div className="text-[10px] text-muted-foreground">{t("buy", "trending", "Buy")}</div>
                          <div className="font-semibold text-xs">{fmt(item.purchaseCost)}</div>
                        </div>
                        <div className="bg-muted/40 rounded-lg py-2">
                          <div className="text-[10px] text-muted-foreground">{t("sell", "trending", "Sell")}</div>
                          <div className="font-semibold text-xs">{fmt(item.sellingPrice)}</div>
                        </div>
                        <div className="bg-emerald-500/10 rounded-lg py-2">
                          <div className="text-[10px] text-muted-foreground">{t("profit_unit", "trending", "Profit/unit")}</div>
                          <div className="font-semibold text-xs text-emerald-400">{fmt(item.grossProfit)}</div>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">{t("gross_margin", "trending", "Gross margin")}</span>
                        <span className="font-bold text-emerald-400">{pct(item.grossMarginPct)}</span>
                      </div>

                      {/* Demand driver */}
                      <div className="flex items-start gap-1.5 bg-muted/20 rounded-md p-2">
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.demandDriver}</p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={`text-xs border ${confidenceBadge(item.confidence)}`}>
                          {item.confidence} confidence
                        </Badge>
                        <Badge variant="outline" className={`text-xs border ${basisBadge(item.priceBasis)}`}>
                          {item.priceBasis}
                        </Badge>
                        <Badge variant="outline" className="text-xs border border-border text-muted-foreground">
                          Unverified
                        </Badge>
                      </div>

                      {/* Data date + CTA */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">{item.dataAsOf}</span>
                        <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          {t("should_i_buy", "trending", "Should I Buy This?")} <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {displayed.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No products match "<strong>{searchQuery}</strong>"</p>
              </div>
            )}

            {/* Data note */}
            <Card className="border-border bg-muted/20">
              <CardContent className="p-4 flex gap-3 items-start">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Prices are indicative estimates from the CSV (as of 19-Oct-2026). Verify with your supplier before purchasing. Gross margin is shown per unit; actual results depend on volume, wastage, and operating costs.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty state */}
        {!hasSearched && (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-primary/10">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Discover Products Worth Stocking</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                  Pick your shop type above to see 96 real product candidates from Mumbai, sorted by profit rank — with buy/sell prices and margin data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
