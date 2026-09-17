/* Vitavolt Global — 81 province rainfall reference layer | 2026-09-17 */
(function (window) {
  'use strict';
  var DATA = {
    source: 'Examining the Probabilistic Characteristics of Maximum Rainfall in Türkiye, Atmosphere 2025, Appendix A',
    sourceUrl: 'https://www.mdpi.com/2073-4433/16/10/1177',
    period: 'station records through 2020',
    unit: 'mm/year',
    confidence: 'REFERENCE',
    provinces: {
      'Adana':668,'Adıyaman':715,'Afyonkarahisar':444,'Ağrı':526,'Aksaray':360,'Amasya':463,'Ankara':392,'Antalya':1040,'Ardahan':558,'Artvin':695,'Aydın':658,'Balıkesir':604,'Bartın':1063,'Batman':489,'Bayburt':451,'Bilecik':461,'Bingöl':945,'Bitlis':1072,'Bolu':555,'Burdur':428,'Bursa':708,'Çanakkale':623,'Çankırı':415,'Çorum':431,'Denizli':568,'Diyarbakır':491,'Düzce':838,'Edirne':599,'Elazığ':421,'Erzincan':376,'Erzurum':431,'Eskişehir':356,'Gaziantep':564,'Giresun':1292,'Gümüşhane':463,'Hakkari':793,'Hatay':1153,'Iğdır':259,'Isparta':566,'İstanbul':661,'İzmir':711,'Kahramanmaraş':722,'Karabük':549,'Karaman':338,'Kars':508,'Kastamonu':485,'Kayseri':390,'Kırıkkale':383,'Kırklareli':582,'Kırşehir':382,'Kilis':499,'Kocaeli':814,'Konya':328,'Kütahya':328,'Malatya':384,'Manisa':742,'Mersin':610,'Mardin':673,'Muğla':862,'Muş':759,'Nevşehir':422,'Niğde':343,'Ordu':1050,'Osmaniye':817,'Rize':2301,'Sakarya':844,'Samsun':722,'Siirt':715,'Sinop':692,'Sivas':430,'Şanlıurfa':459,'Şırnak':720,'Tekirdağ':578,'Tokat':435,'Trabzon':829,'Tunceli':871,'Uşak':558,'Van':395,'Yalova':755,'Yozgat':572,'Zonguldak':1226
    }
  };
  window.VitaRainfallData = DATA;
  if (window.VitaEngine && window.VitaEngine.config && window.VitaEngine.config.water) {
    window.VitaEngine.config.water.rainfallMmByCity = Object.assign({}, DATA.provinces);
    window.VitaEngine.config.water.rainfallSource = DATA.source;
    window.VitaEngine.config.water.rainfallSourceUrl = DATA.sourceUrl;
    window.VitaEngine.config.water.rainfallPeriod = DATA.period;
    window.VitaEngine.config.water.rainfallConfidence = DATA.confidence;
  }
})(typeof window !== 'undefined' ? window : global);
