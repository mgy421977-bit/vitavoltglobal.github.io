/* Vitavolt Global — Rainwater province data layer | 2026-09-17 */
(function (window) {
  'use strict';
  var SOURCE = 'Temel, Asikoglu & Alp (2025), Atmosphere 16(10), 1177; Appendix A; MGM station records';
  var DATA_YEAR = 'station records through 2020';
  var rainfallMmByCity = {
    'Adana':668,'Adıyaman':715,'Afyonkarahisar':444,'Ağrı':526,'Aksaray':360,'Amasya':463,'Ankara':392,'Antalya':1040,'Ardahan':558,'Artvin':695,'Aydın':658,'Balıkesir':604,'Bartın':1063,'Batman':489,'Bayburt':451,'Bilecik':461,'Bingöl':945,'Bitlis':1072,'Bolu':555,'Burdur':428,'Bursa':708,'Çanakkale':623,'Çankırı':415,'Çorum':431,'Denizli':568,'Diyarbakır':491,'Düzce':838,'Edirne':599,'Elazığ':421,'Erzincan':376,'Erzurum':431,'Eskişehir':356,'Gaziantep':564,'Giresun':1292,'Gümüşhane':463,'Hakkari':793,'Hatay':1153,'Iğdır':259,'Isparta':566,'İstanbul':661,'İzmir':711,'Kahramanmaraş':722,'Karabük':549,'Karaman':338,'Kars':508,'Kastamonu':485,'Kayseri':390,'Kırıkkale':383,'Kırklareli':582,'Kırşehir':382,'Kilis':499,'Kocaeli':814,'Konya':328,'Kütahya':328,'Malatya':384,'Manisa':742,'Mardin':673,'Mersin':610,'Muğla':862,'Muş':759,'Nevşehir':422,'Niğde':343,'Ordu':1050,'Osmaniye':817,'Rize':2301,'Sakarya':844,'Samsun':722,'Siirt':715,'Sinop':692,'Sivas':430,'Şanlıurfa':459,'Şırnak':720,'Tekirdağ':578,'Tokat':435,'Trabzon':829,'Tunceli':871,'Uşak':558,'Van':395,'Yalova':755,'Yozgat':572,'Zonguldak':1226
  };
  function install() {
    if (!window.VitaEngine || !window.VitaEngine.config || !window.VitaEngine.config.water) return false;
    var water = window.VitaEngine.config.water;
    water.rainfallMmByCity = Object.assign({}, rainfallMmByCity, water.rainfallMmByCity || {});
    water.rainfallSource = SOURCE;
    water.rainfallDataPeriod = DATA_YEAR;
    water.rainfallDataStatus = 'REFERENCE_DATA_81_PROVINCES';
    water.rainfallDataConfidence = 'MEDIUM';
    water.rainfallMethodNote = 'Province-level station annual rainfall reference; project design should use site/station-specific verified rainfall where available.';
    window.VitaRainwaterData = { source: SOURCE, period: DATA_YEAR, status: 'REFERENCE_DATA_81_PROVINCES', confidence: 'MEDIUM', rainfallMmByCity: rainfallMmByCity };
    return true;
  }
  var tries = 0;
  var timer = setInterval(function () { tries++; if (install() || tries > 400) clearInterval(timer); }, 25);
})(typeof window !== 'undefined' ? window : global);
