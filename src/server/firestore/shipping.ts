import { getFirebaseAdmin } from "@/server/firebase-admin";
import { formatVndPrice } from "@/server/money";

export type LocationOption = {
  code: string;
  name: string;
};

export const provinces: LocationOption[] = [
  { code: "hcm", name: "TP Hồ Chí Minh" },
  { code: "hn", name: "Hà Nội" },
  { code: "dn", name: "Đà Nẵng" },
  { code: "other", name: "Tỉnh/thành khác" },
];

const districtsByProvince: Record<string, LocationOption[]> = {
  hcm: [
    { code: "quan-1", name: "Quận 1" },
    { code: "quan-3", name: "Quận 3" },
    { code: "thu-duc", name: "Thành phố Thủ Đức" },
    { code: "other", name: "Quận/huyện khác" },
  ],
  hn: [
    { code: "hoan-kiem", name: "Hoàn Kiếm" },
    { code: "ba-dinh", name: "Ba Đình" },
    { code: "dong-da", name: "Đống Đa" },
    { code: "other", name: "Quận/huyện khác" },
  ],
  dn: [
    { code: "hai-chau", name: "Hải Châu" },
    { code: "thanh-khe", name: "Thanh Khê" },
    { code: "other", name: "Quận/huyện khác" },
  ],
  other: [{ code: "other", name: "Quận/huyện khác" }],
};

const wardsByDistrict: Record<string, LocationOption[]> = {
  other: [{ code: "other", name: "Phường/xã khác" }],
};

function normalizeLocation(value: string) {
  return value.trim().toLowerCase();
}

export async function calculateShippingFee(province: string) {
  const normalizedProvince = normalizeLocation(province);
  const { db } = getFirebaseAdmin();
  const rateSnapshot = await db.collection("shippingRates").doc(normalizedProvince).get();
  const rate = rateSnapshot.exists ? rateSnapshot.data()?.fee : undefined;
  const fallbackFee = normalizedProvince.includes("hồ chí minh") || normalizedProvince.includes("hcm") ? 30000 : 40000;
  const fee = typeof rate === "number" ? rate : fallbackFee;

  return {
    fee,
    feeText: formatVndPrice(fee),
  };
}

export function listProvinces() {
  return provinces;
}

export function listDistricts(provinceCode: string) {
  return districtsByProvince[provinceCode] || districtsByProvince.other;
}

export function listWards(districtCode: string) {
  return wardsByDistrict[districtCode] || wardsByDistrict.other;
}
