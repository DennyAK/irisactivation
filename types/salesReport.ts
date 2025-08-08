export interface SalesReportFormData {
  week: string; channel: string; activityName: string; tier: string; date: string; city: string; area: string; outletVenueName: string; capacity: string; outletId: string;
  outletName: string; outletProvince: string; outletCity: string; outletCapacity: string; outletNoOfTableAVailable: string;
  assignedToBA: string; assignedToTL: string; teamLeaderName: string; spgName: string;
  salesKegs330: string; salesKegs500: string; salesMd500: string; salesGdic400: string; salesSmoothPint330: string; salesSmoothCan330: string; salesGfesPint330: string; salesGfesCan330: string; salesGfesQuart620: string; salesGfesCanbig500: string;
  samplingAvailable: boolean; samplingSmoothBottle: string; samplingSmoothOnLips: string; samplingSmoothBottleToBuy: string; samplingGfesBottle: string; samplingGfesOnLips: string; samplingGfesToBuy: string; samplingKegs: string; samplingKegsOnLips: string; samplingKegsToBuy: string; samplingMd: string; samplingMdOnLips: string; samplingMdToBuy: string; samplingGdic: string;
  callsOffers: string; effectiveCalls: string; callsVsEffectivePercentage: string;
  guinessPromoAvailable: boolean; guinessPromoDescription: string; guinessPromoSold: string;
  guinessSmoothPromoAvailable: boolean; guinessSmoothPromoDescription: string; guinessSmoothPromoSold: string; guinessSmoothPromoRepeatOrder: string; guinessSmoothPromoDescriptionType2: string; guinessSmoothPromoSoldType2: string; guinessSmoothPromoRepeatOrderType2: string;
  guinessGfesPromoAvailable: boolean; guinessGfesPromoDescription: string; guinessGfesPromoSold: string; guinessGfesPromoRepeatOrder: string; guinessGfesPromoDescriptionType2: string; guinessGfesPromoSoldType2: string; guinessGfesPromoRepeatOrderType2: string;
  guinessKegsPromoAvailable: boolean; guinessKegsPromoDescription: string; guinessKegsPromoSold: string; guinessKegsPromoRepeatOrder: string; guinessKegsPromoDescriptionType2: string; guinessKegsPromoSoldType2: string; guinessKegsPromoRepeatOrderType2: string;
  guinessMdPromoAvailable: boolean; guinessMdPromoDescription: string; guinessMdPromoSold: string; guinessMdPromoRepeatOrder: string; guinessMdPromoDescriptionType2: string; guinessMdPromoSoldType2: string; guinessMdPromoRepeatOrderType2: string;
  guinessGdicPromoAvailable: boolean; guinessGdicPromoDescription: string; guinessGdicPromoSold: string; guinessGdicPromoRepeatOrder: string; guinessGdicPromoDescriptionType2: string; guinessGdicPromoSoldType2: string; guinessGdicPromoRepeatOrderType2: string;
  visitorAlcoholTotal: string; visitorAlcoholMale: string; visitorAlcoholFemale: string; visitorNonAlcoholTotal: string; visitorNonAlcoholMale: string; visitorNonAlcoholFemale: string;
  totalGuinnessBuyers: string; totalNonGuinnessBuyers: string; tablesAllCompetitorOnlyDrinkers: string;
  merchandiseDescription1: string; merchandiseSold1: string;
  merchandiseDescription2: string; merchandiseSold2: string;
  merchandiseDescription3: string; merchandiseSold3: string;
  merchandiseDescription4: string; merchandiseSold4: string;
  merchandiseDescription5: string; merchandiseSold5: string;
  stoutieProgramParticipation: boolean; stoutieProgramCallReach: string; stoutieProgramPacketSold: string; stoutieProgramEngagePeople: string;
  loyaltyProgramParticipation: boolean; loyaltyProgramCallReach?: string; loyaltyProgramPacketSold?: string; loyaltyProgramEngagePeople?: string;
  brightballParticipation?: boolean; brightballCallReach?: string; brightballPacketSold?: string; brightballEngagePeople?: string;
  sovProgramParticipation?: boolean; sovProgramCallReach?: string; sovProgramPacketSold?: string; sovProgramEngagePeople?: string;
  weatherStatus: string; issuesNotesRequests: string; learningPoints: string; salesReportDetailStatus: string;
  [key: string]: any;
}

export interface ValidationIssue { field: string; message: string; }

export function validateSalesReport(data: SalesReportFormData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const requiredBasic = ['week','channel','activityName','date','outletId'];
  requiredBasic.forEach(f => { if(!data[f]) issues.push({ field: f, message: 'Required' }); });
  // Example numeric validations
  const numericMaybe = ['salesKegs330','salesKegs500','salesMd500'];
  numericMaybe.forEach(f => { const v = data[f]; if (v && isNaN(Number(v))) issues.push({ field: f, message: 'Must be numeric' }); });
  // Auto-calc suggestion: if calls & effective present, mismatch stored percentage
  if (data.callsOffers && data.effectiveCalls) {
    const offers = Number(data.callsOffers); const eff = Number(data.effectiveCalls);
    if(!isNaN(offers) && offers>0 && !isNaN(eff)) {
      const pct = ((eff / offers) * 100).toFixed(1) + '%';
      if (data.callsVsEffectivePercentage && data.callsVsEffectivePercentage !== pct) {
        issues.push({ field: 'callsVsEffectivePercentage', message: `Should be ${pct}` });
      }
    }
  }
  return issues;
}
