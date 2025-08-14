// Generates XLSX templates for QR and SRD with header-only rows
// Outputs:
//  - data/templates/templates.xlsx (two sheets: QR, SRD)
//  - data/templates/qr_headers.xlsx
//  - data/templates/srd_headers.xlsx

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const qrHeaders = [
  'guardDate','assignedToBA','assignedToTL','outletId','outletName','outletProvince','outletCity','outletTier',
  'salesKegs330','salesKegs500','salesMd500','salesGdic400','salesSmoothPint330','salesSmoothCan330','salesGfesPint330','salesGfesCan330','salesGfesQuart620','salesGfesCanbig500',
  'productRestock','productRestockDescription','taskSalesReportQuickStatus'
];

const srdHeaders = [
  'week','channel','activityName','tier','date','city','area','outletVenueName','capacity','outletId',
  'outletName','outletProvince','outletCity','outletCapacity','outletNoOfTableAVailable','assignedToBA','assignedToTL','teamLeaderName','spgName',
  'salesKegs330','salesKegs500','salesMd500','salesGdic400','salesSmoothPint330','salesSmoothCan330','salesGfesPint330','salesGfesCan330','salesGfesQuart620','salesGfesCanbig500',
  'samplingDataAvailable','samplingSmoothBottle','samplingSmoothOnLips','samplingSmoothBottleToBuy','samplingGfesBottle','samplingGfesOnLips','samplingGfesToBuy','samplingKegs','samplingKegsOnLips','samplingKegsToBuy','samplingMd','samplingMdOnLips','samplingMdToBuy','samplingGdic','samplingGdicOnLips','samplingGdicBottle','samplingGdicBottleToBuy',
  'callsOffers','effectiveCalls','callsVsEffectivePercentage',
  'salesSmoothCan','salesSmoothBotol','salesGfesCan','salesGfesCanBig','salesGfesBotol','salesGfesQuart','salesKegs','salesMd','salesGdic',
  'guinnessSmoothPromotionAvailable','promoSmoothDescription','promoSmoothRepeatOrders','promoSmoothSold',
  'guinnessGfesPromotionAvailable','promoGfesDescription','promoGfesRepeatOrders','promoGfesSold',
  'guinnessKegsPromotionAvailable','promoKegsDescription','promoKegsRepeatOrders','promoKegsSold',
  'guinnessMicroDraughtPromotionAvailable','promoMicrodraughtDescription','promoMicrodraughtRepeatOrders','promoMicrodraughtSold',
  'guinnessGdicPromotionAvailable','promoGdicDescription','promoGdicRepeatOrders','promoGdicSold',
  'packagesSold','repeatOrders',
  'promoSmoothDescriptionType2','promoSmoothRepeatOrdersType2','promoSmoothSoldType2','promoGfesDescriptionType2','promoGfesRepeatOrdersType2','promoGfesSoldType2','promoKegsDescriptionType2','promoKegsRepeatOrdersType2','promoKegsSoldType2','promoMicrodraughtDescriptionType2','promoMicrodraughtRepeatOrdersType2','promoMicrodraughtSoldType2','promoGdicDescriptionType2','promoGdicRepeatOrdersType2','promoGdicSoldType2',
  'visitorsOverall','visitorsAlcoholDrinkers','visitorsAllBeerDrinkers','visitorsAllGuinness','visitorsAllCompetitor','visitorsAllGuinnessMixedCompetitor',
  'drinkersSmooth','drinkersGfes','drinkersKegs','drinkersMicrodraught','drinkersGdic','drinkersMixed',
  'tablesOverall','tablesAlcoholDrinkers','tablesNonAlcoholDrinkers','tablesAllBeerDrinkers','tablesAllGuinness','tablesAllCompetitor','tablesAllGuinnessMixedCompetitor',
  'competitorBintangAvailable','competitorBintangGlass','competitorBintangPint','competitorBintangQuart','competitorBintangCanSmall','competitorBintangCanBig','competitorBintangPromoDescription','competitorBintangPromoSold',
  'competitorBintangCrystalAvailable','competitorBintangCrystalGlass','competitorBintangCrystalPint','competitorBintangCrystalQuart','competitorBintangCrystalCanSmall','competitorBintangCrystalCanBig','competitorBintangCrystalPromoDescription','competitorBintangCrystalPromoSold',
  'competitorHeinekenAvailable','competitorHeinekenGlass','competitorHeinekenPint','competitorHeinekenQuart','competitorHeinekenCanSmall','competitorHeinekenCanBig','competitorHeinekenPromoDescription','competitorHeinekenPromoSold',
  'competitorHeinekenImportAvailable','competitorHeinekenImportGlass','competitorHeinekenImportPint','competitorHeinekenImportQuart','competitorHeinekenImportCanSmall','competitorHeinekenImportCanBig','competitorHeinekenImportPromoDescription','competitorHeinekenImportPromoSold',
  'competitorErdingerImportAvailable','competitorErdingerImportGlass','competitorErdingerImportPint','competitorErdingerImportQuart','competitorErdingerImportCanSmall','competitorErdingerImportCanBig','competitorErdingerImportPromoDescription','competitorErdingerImportPromoSold',
  'competitorBudweizerImportAvailable','competitorBudweizerImportGlass','competitorBudweizerImportPint','competitorBudweizerImportQuart','competitorBudweizerImportCanSmall','competitorBudweizerImportCanBig','competitorBudweizerImportPromoDescription','competitorBudweizerImportPromoSold',
  'competitorAnkerAvailable','competitorAnkerGlass','competitorAnkerPint','competitorAnkerQuart','competitorAnkerCanSmall','competitorAnkerCanBig','competitorAnkerPromoDescription','competitorAnkerPromoSold',
  'competitorBalihaiAvailable','competitorBalihaiGlass','competitorBalihaiPint','competitorBalihaiQuart','competitorBalihaiCanSmall','competitorBalihaiCanBig','competitorBalihaiPromoDescription','competitorBalihaiPromoSold',
  'competitorProstAvailable','competitorProstGlass','competitorProstPint','competitorProstQuart','competitorProstCanSmall','competitorProstCanBig','competitorProstPromoDescription','competitorProstPromoSold',
  'competitorSanMiguelAvailable','competitorSanMiguelGlass','competitorSanMiguelPint','competitorSanMiguelQuart','competitorSanMiguelCanSmall','competitorSanMiguelCanBig','competitorSanMiguelPromoDescription','competitorSanMiguelPromoSold',
  'competitorSingarajaAvailable','competitorSingarajaGlass','competitorSingarajaPint','competitorSingarajaQuart','competitorSingarajaCanSmall','competitorSingarajaCanBig',
  'competitorCarlsbergAvailable','competitorCarlsbergGlass','competitorCarlsbergPint','competitorCarlsbergQuart','competitorCarlsbergCanSmall','competitorCarlsbergCanBig','competitorCarlsbergPromoDescription','competitorCarlsbergPromoSold',
  'competitorDraftBeerAvailable','competitorDraftBeerGlass','competitorDraftBeerPint','competitorDraftBeerQuart','competitorDraftBeerCanSmall','competitorDraftBeerCanBig','competitorDraftBeerPromoDescription','competitorDraftBeerPromoSold',
  'competitorKuraKuraAvailable','competitorKuraKuraGlass','competitorKuraKuraPint','competitorKuraKuraQuart','competitorKuraKuraCanSmall','competitorKuraKuraCanBig','competitorKuraKuraPromoDescription','competitorKuraKuraPromoSold',
  'competitorIslandBrewingAvailable','competitorIslandBrewingGlass','competitorIslandBrewingPint','competitorIslandBrewingQuart','competitorIslandBrewingCanSmall','competitorIslandBrewingCanBig','competitorIslandBrewingPromoDescription','competitorIslandBrewingPromoSold',
  'competitorOthersAvailable','competitorOthersGlass','competitorOthersPint','competitorOthersQuart','competitorOthersCanSmall','competitorOthersCanBig','competitorOthersPromoDescription','competitorOthersPromoSold',
  'competitorActivityDescription','competitorActivitySpgTotal',
  'merchandiseAvailable','merchandiseDistributed','merchandiseDescription1','merchandiseSold1','merchandiseDescription2','merchandiseSold2','merchandiseDescription3','merchandiseSold3','merchandiseDescription4','merchandiseSold4','merchandiseDescription5','merchandiseSold5',
  'weatherStatus',
  'stoutieProgramParticipation','stoutieProgramDescription','stoutieProgramCallReach','stoutieProgramPacketSold','stoutieProgramEngagePeople',
  'loyaltyProgramParticipation','loyaltyProgramDescription','loyaltyProgramCallReach','loyaltyProgramPacketSold','loyaltyProgramEngagePeople',
  'brightballParticipation','brightballDescription','brightballCallReach','brightballPacketSold','brightballEngagePeople',
  'sovProgramParticipation','sovProgramDescription','sovProgramCallReach','sovProgramPacketSold','sovProgramEngagePeople',
  'baliSpecificVisitorData','baliLocalVisitors','baliForeignVisitors','baliLocalGuinnessBuyers','baliForeignGuinnessBuyers',
  'amsGfes','amsSmooth','amsMicrodraught','amsKegs','amsTotal',
  'issuesNotesRequests','learningPoints','beerMarketSize','totalGuinnessSales','achievementPercentage',
  'salesReportDetailStatus'
];

function makeSheet(headers) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  // Bold header row
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true },
      alignment: { vertical: 'center' }
    };
  }
  ws['!rows'] = [{ hpt: 24 }];
  return ws;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

(function run() {
  const outDir = path.resolve(__dirname, '..', 'data', 'templates');
  ensureDir(outDir);

  // Single workbook with both sheets
  const wb = XLSX.utils.book_new();
  const qrSheet = makeSheet(qrHeaders);
  const srdSheet = makeSheet(srdHeaders);
  XLSX.utils.book_append_sheet(wb, qrSheet, 'QR');
  XLSX.utils.book_append_sheet(wb, srdSheet, 'SRD');
  XLSX.writeFile(wb, path.join(outDir, 'templates.xlsx'));

  // Individual files
  const wbQR = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbQR, makeSheet(qrHeaders), 'QR');
  XLSX.writeFile(wbQR, path.join(outDir, 'qr_headers.xlsx'));

  const wbSRD = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbSRD, makeSheet(srdHeaders), 'SRD');
  XLSX.writeFile(wbSRD, path.join(outDir, 'srd_headers.xlsx'));

  console.log('Generated XLSX templates in data/templates');
})();
