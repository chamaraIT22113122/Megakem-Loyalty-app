const mongoose = require('mongoose');
const Member = require('../models/Member');
const dns = require('dns');
require('dotenv').config();

// Override DNS resolver to use Google's public DNS (8.8.8.8)
// This fixes querySrv ECONNREFUSED errors caused by local DNS blocking SRV lookups
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const hardwaresList = [
  {
    name: 'K.I.Distributors',
    address: 'No.426,Galle Road,Rawathawaththa,Moratuwa,Sri Lanka',
    phone: '011 3496575',
    contactPerson: 'Mr. Indika',
    contactMobile: '071 8047850',
    zone: 'Zone 01',
    location: 'Moratuwa'
  },
  {
    name: 'T.K.Flooring & Waterproofing (Pvt) Ltd',
    address: 'No.210,Point Pedro Road, Anaipanthi,Jaffna,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Thinakaran',
    contactMobile: '077 9891412',
    zone: 'Zone 05',
    location: 'Jaffna'
  },
  {
    name: 'The Colour Zone',
    address: '53/C, Adnives Rd, PeriyamullaNegombo,Sri Lanka',
    phone: '031 2282444',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: 'Negombo'
  },
  {
    name: 'Colombo Traders',
    address: 'No.174/C,Messenger Street,Colombo - 12,Sri Lanka',
    phone: '011 324 648',
    contactPerson: 'Mr. Mohomad Fahim',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'Plan Craft Waterproofing',
    address: 'Arayampathi 02, Batticaloa, Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Vinoth',
    contactMobile: '074 0388334',
    zone: 'Zone 04',
    location: 'Batticaloa'
  },
  {
    name: 'Sampath Construction',
    address: 'Rathnagiri Mawatha,SandarawalaBaddegama,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 03',
    location: 'Baddegama'
  },
  {
    name: 'Suniro Paints & Hardwear',
    address: 'No. 04, Shopping Complex, Ragama Rd, Mahabage,Ragama,Sri Lanka',
    phone: '011 2951048',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Ragama'
  },
  {
    name: 'Senahas Colour Mart',
    address: 'Malabe,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Prasanna',
    contactMobile: '070 1480528',
    zone: '',
    location: 'Malabe'
  },
  {
    name: 'DB Coating',
    address: '92/5, Pilihudugolla, NeulaNaula,Kandy,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Dilshan',
    contactMobile: '074 2248734',
    zone: 'Zone 03',
    location: 'Kandy'
  },
  {
    name: 'N and A ENGINEERING Services (PVT) LTD',
    address: '267/65,MORAWAKAWATTA,KADUWELA,Sri Lanka',
    phone: '',
    contactPerson: 'Ms. Janaki',
    contactMobile: '070 4492648',
    zone: 'Zone 01',
    location: 'Kaduwela'
  },
  {
    name: 'C & C Hardwear',
    address: '401 Colombo Rd, PuwakpitiyaAvissawella,Sri Lanka',
    phone: '036 2222499',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Avissawella'
  },
  {
    name: 'S.G Waterproofing',
    address: 'No. 149/2,Samanabedda,Hanwella,Sri Lanka',
    phone: '076 627 1259',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Hanwella'
  },
  {
    name: 'Cargo Waterproofing (Pvt) Ltd',
    address: 'No.63,Station Road, Kelaniya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Sunil',
    contactMobile: '077 0428001',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'Nadeeka Paint Center (Pvt) Ltd.',
    address: '85/2 NEGAMBO Rd,Wattala,Sri Lanka',
    phone: '011 7602020',
    contactPerson: 'Mr.Roshan',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Wattala'
  },
  {
    name: 'New Lucky Trade Center',
    address: 'No.08,Sathsara Uyana,Bellapitiya,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Bellapitiya'
  },
  {
    name: 'Indra Paints',
    address: 'No.46,Moretuwa Road,Piliyandala,Sri Lanka',
    phone: '0112 614 267',
    contactPerson: 'Mr. Banduka Perera',
    contactMobile: '077 728 4323',
    zone: 'Zone 01',
    location: 'Piliyandala'
  },
  {
    name: 'J.T.L Paint Center',
    address: '124,Agalawaththa Rd,Mathugama,Sri Lanka',
    phone: '034 2241234',
    contactPerson: 'Mr. Ranuka',
    contactMobile: '076 710 5411',
    zone: 'Zone 01',
    location: 'Mathugama'
  },
  {
    name: 'Tudawa Brothers',
    address: 'No.55/2,Elvitigala Mw,Colombo-05,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Sumudu',
    contactMobile: '077 0452043',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'AADITHYA Lanka (Pvt) Ltd',
    address: '56A, First Floor,Horton Place,Colombo 07,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'Perly Chemic',
    address: 'Polakandavila, Sapugoda, MataraKaburupitiya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Saman',
    contactMobile: '076 7191065',
    zone: 'Zone 02',
    location: 'Kaburupitiya'
  },
  {
    name: 'United Paint Center',
    address: 'No. 48/6,Colombo Rd,Kandana,Sri Lanka',
    phone: '011 2245678',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kandana'
  },
  {
    name: 'Quick Seal (Pvt) Ltd',
    address: 'No.40,Attidiya Road,Rathmalana,Sri Lanka',
    phone: '011 272721',
    contactPerson: 'Mr. Manjula',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Rathmalana'
  },
  {
    name: 'Rock Paint',
    address: 'Front of Maliyadeva College,Negombo Road,Kurunegala,Sri Lanka',
    phone: '074 270 6087',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 03',
    location: 'Kurunegala'
  },
  {
    name: 'LAYLEY Paints',
    address: 'No. 114,Justice Akbar Mawatha,Colombo 02,Sri Lanka',
    phone: '',
    contactPerson: 'M.H Hisham',
    contactMobile: '077 742 3933',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'MB Colour Center',
    address: 'No. 390/4,Borella road, Kalalgoda,Pannipitiya,Sri Lanka',
    phone: '071 096 3039',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Pannipitiya'
  },
  {
    name: 'APEC Holdings',
    address: 'No.165,Summer side gardens, Oruwala,Athurugiriya,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Athurugiriya'
  },
  {
    name: 'SS Waterproofing',
    address: 'No.101,Malgama Road, Mahawatta,Mulleriyawa,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Mulleriyawa'
  },
  {
    name: 'Indra Hardware',
    address: 'No. 46,Moraturwa Rd,Piliyandala,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Banduka',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Piliyandala'
  },
  {
    name: 'Pearly Solution (Pvt) Ltd',
    address: 'Polakandavila, Sapugoda, MataraKaburupitiya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Saman',
    contactMobile: '076 7191065',
    zone: 'Zone 02',
    location: 'Kaburupitiya'
  },
  {
    name: 'Tharushi Engineering works',
    address: 'No.14/G, Lesly T. Perera Mawatha, Kaluthara NorthKaluthara,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kalutara'
  },
  {
    name: 'Tml Engineering Company',
    address: 'No 104 Waragoda Road, KeleniyaKelaniya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Maduranga',
    contactMobile: '077 7812809',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'Jayawardene & Sons (Pvt) Ltd',
    address: 'No. 185/1/C,Makole SouthMakole,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Makola'
  },
  {
    name: 'Petro Master Painters (Pvt) Ltd',
    address: '290,D.R Wijewardena Mawatha,Colombo - 10,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'A.S.G Paints (Pvt) Ltd',
    address: 'No 233/B, Galle Junction,Kandy Road,Kiribethgoda,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Nipun',
    contactMobile: '076 633 0073',
    zone: 'Zone 01',
    location: 'Kiribathgoda'
  },
  {
    name: 'Thisera Trading Enterprises (Pvt) Ltd',
    address: 'No. 03,High-level Road, Pahethgama,Hanwella,Sri Lanka',
    phone: '0117 216 822',
    contactPerson: 'Mr. Nuwan',
    contactMobile: '075 676 1216',
    zone: 'Zone 01',
    location: 'Hanwella'
  },
  {
    name: 'Vaseharan Traders',
    address: 'No 210/206,Main street,Trincomalee,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Vaseharan',
    contactMobile: '077 6669333',
    zone: 'Zone 05',
    location: 'Trincomalee'
  },
  {
    name: 'Sasitha Hardware',
    address: 'No.134,Thalapathpitiya,Nugegoda,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Ashoka',
    contactMobile: '077 7289606',
    zone: 'Zone 01',
    location: 'Nugegoda'
  },
  {
    name: 'Saran Hardwear',
    address: 'No.9CIII/D WD.DALUPOTHA,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Salitha',
    contactMobile: '071 0162920',
    zone: 'Zone 01',
    location: 'Dalupotha'
  },
  {
    name: 'Besta Holdings',
    address: 'No. 5/11,Ariedeme/hthespura, Thutupeladhenne road,Belihuloda,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 05',
    location: 'Belihuloya'
  },
  {
    name: 'SAW Engineering (Pvt) Ltd',
    address: 'No.32,Mekula North, Mekula,Kiribethgoda,Sri Lanka',
    phone: '011 2908366',
    contactPerson: 'Mr. Charuka',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kiribathgoda'
  },
  {
    name: 'New R.N. Hardware',
    address: 'No. 110/3,Kidelulya,Welimada,Bandarawela,Sri Lanka',
    phone: '077 536 0527',
    contactPerson: 'Mr. Chanderla',
    contactMobile: '077 536 0527',
    zone: 'Zone 03',
    location: 'Bandarawela'
  },
  {
    name: 'T.S.K Waterproofing',
    address: 'Pannipitiya,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Pannipitiya'
  },
  {
    name: 'Akway Waterproofing',
    address: 'No. 101,Main Street,Rathnapura,Sri Lanka',
    phone: '045 7321313',
    contactPerson: 'Mr. Lakshitha',
    contactMobile: '076 0301313',
    zone: 'Zone 03',
    location: 'Ratnapura'
  },
  {
    name: 'Chandana Hardware Stores',
    address: 'No. 141, Kandy Road,Dalugama,Kelaniya,Sri Lanka',
    phone: '0112 907 931',
    contactPerson: 'Mr. Chandana',
    contactMobile: '077 325 2613',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'George Steuart Engineering (Pvt) Ltd',
    address: 'No. 21,Rosmed Place,Colombo 07,Sri Lanka',
    phone: '0112 690 256',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'Jayamanne Construction',
    address: 'No 328-1,Kaduwela Rd,Koswatte,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Jayamanne',
    contactMobile: '077 354 8773',
    zone: 'Zone 01',
    location: 'Koswatte'
  },
  {
    name: 'Karunanayake Enterprises',
    address: 'No. 218,Thalapathpitiya Road,Nugegoda,Sri Lanka',
    phone: '0112 799 792',
    contactPerson: 'Mr. K.A Jayanthe Karunanayake',
    contactMobile: '077 112 6157',
    zone: 'Zone 01',
    location: 'Nugegoda'
  },
  {
    name: 'Liyanarachchi Super Luck Hardware (Pvt) Ltd',
    address: 'No. 1/3,Central Junction,Ragama,Kirillawala,Sri Lanka',
    phone: '0332 225 179',
    contactPerson: 'Mr. Surenya',
    contactMobile: '077 7361116',
    zone: 'Zone 01',
    location: 'Ragama'
  },
  {
    name: 'Aqua Waterproofing',
    address: 'No 107,Dippitigoda,Kelaniya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Manjula',
    contactMobile: '077 6655310',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'Dockyard General Engineering Service (Pvt) Ltd',
    address: '223 Jayantha Mallimarachchi Mawatha,Colombo - 14,Sri Lanka',
    phone: '0112 110 510',
    contactPerson: 'Ms. Navodi',
    contactMobile: '0716 165 779',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'New Samarasekara Hardware',
    address: 'No. 130, Wellawaya Road,Wellawaya Road,Monaragala,Sri Lanka',
    phone: '0553 928 851',
    contactPerson: 'Mr. Rasika',
    contactMobile: '071 1208075',
    zone: 'Zone 03',
    location: 'Monaragala'
  },
  {
    name: 'Rathna Lime Stores',
    address: 'No. 160Temples Rd, DehiwelaMount Lavinya,Sri Lanka',
    phone: '011 2718567',
    contactPerson: 'Mr. Rathna',
    contactMobile: '072 7545351',
    zone: 'Zone 01',
    location: 'Dehiwela'
  },
  {
    name: 'Thennakoon Trade Center',
    address: 'No.98,Kandy Road,Dalumgama,Mudungoda,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Prasanna Kumara Thennakoon',
    contactMobile: '077 622 8169',
    zone: 'Zone 01',
    location: 'Mudungoda'
  },
  {
    name: 'C & N Chemicals',
    address: 'No. 38/1/1, First Lane,Gamunupura,Kaduwela,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kaduwela'
  },
  {
    name: 'Fintec Engineering Solutions (Pvt) Ltd',
    address: 'No 1060,Pernipitiya Road,Mulleriyawa,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Mulleriyawa'
  },
  {
    name: 'Maharama Paints',
    address: 'No 251,1,Highlevel Road ,WattegederaMaharagama,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. M.V.G Gamini',
    contactMobile: '077 763 6377',
    zone: 'Zone 01',
    location: 'Maharagama'
  },
  {
    name: 'New Athula Colour House',
    address: '78/35 G A de silva mw, Viligoda,Ambalangoda,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Athula',
    contactMobile: '077 5231737',
    zone: 'Zone 03',
    location: 'Ambalangoda'
  },
  {
    name: 'Shalley Hardware',
    address: '330, Mairi st,Dharga TownDharga town,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Shaliq',
    contactMobile: '076 2281612',
    zone: 'Zone 01',
    location: 'Dharga Town'
  },
  {
    name: 'Ariyaratne Trade Center',
    address: 'No. 63,Paddukka Road,Horana,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Horana'
  },
  {
    name: 'Kala Engineering Chemicals',
    address: 'No. 561/3 D,Dippitigoda road,Kelaniya,Sri Lanka',
    phone: '0117 996 818',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'Rajapaksha & Sons',
    address: '535,MawaramandiyawSiyambalape,Sri Lanka',
    phone: '011 2976179',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Mawaramandiya'
  },
  {
    name: 'Sarasavi Enterprises',
    address: 'Radawana RoadKirindiwela,Sri Lanka',
    phone: '033 2267506',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kirindiwela'
  },
  {
    name: 'Anson H/W',
    address: 'Main street, Pothuvil,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Imran',
    contactMobile: '077 6261200',
    zone: 'Zone 03',
    location: 'Pothuvil'
  },
  {
    name: 'Colour Tek',
    address: 'Pannala Road,Eriyawala,Dankotuwa,Sri Lanka',
    phone: '0312 265 580',
    contactPerson: 'Mr. Pradeep',
    contactMobile: '077 439 8135',
    zone: 'Zone 03',
    location: 'Dankotuwa'
  },
  {
    name: 'Con Chemi Sovereignty',
    address: 'No.157/15/1,Dewala Road,Makola,Sri Lanka',
    phone: '033 4549826',
    contactPerson: 'Mr. Imalka',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Makola'
  },
  {
    name: 'Kadelia Living in Style',
    address: 'No 216,Kuliyapitiya Rd,Pannala,Sri Lanka',
    phone: '0372 246 569',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 03',
    location: 'Pannala'
  },
  {
    name: 'MLP Perera Holding (PVT) LTD',
    address: 'No 165,Kandy Road,Kelaniya,Sri Lanka',
    phone: '011 4645340',
    contactPerson: 'Mr. Liyanage',
    contactMobile: '071 7867236',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'MT Construction',
    address: 'Molagoda,Kegalle,Sri Lanka',
    phone: '035 2228090',
    contactPerson: 'Mr. Gayan',
    contactMobile: '076 4972448',
    zone: 'Zone 03',
    location: 'Kegalle'
  },
  {
    name: 'Nethmi Stores',
    address: 'No. 87/2,Mandawala Road,Pugoda,Sri Lanka',
    phone: '077 295 5953',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Pugoda'
  },
  {
    name: 'Sanath Steel',
    address: 'No. 364,Madampe Road,Kuliyapitiya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Hettiarachchi',
    contactMobile: '071 0982151',
    zone: 'Zone 03',
    location: 'Kuliyapitiya'
  },
  {
    name: 'Solidwin Engineering Enterprises (Pvt) Ltd',
    address: 'No. 238/1/18,Kahawa,Kosgama,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. K.P.L Gunawardhana',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kosgama'
  },
  {
    name: 'DN Hardware',
    address: 'Aluth Malkaduwawa, KurunegalaKurunegala,Sri Lanka',
    phone: '037 7200652',
    contactPerson: 'Mr. Athula',
    contactMobile: '077 0844444',
    zone: 'Zone 03',
    location: 'Kurunegala'
  },
  {
    name: 'Damro Leisure (Pvt) Ltd',
    address: 'No. 361,Kandy Road,Nittambuwa,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Nittambuwa'
  },
  {
    name: 'Kodithuwakku Hardware',
    address: 'No 403/01 A,Uhana Road ,Ampara,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Pubudu',
    contactMobile: '077 3214841',
    zone: 'Zone 04',
    location: 'Ampara'
  },
  {
    name: 'New Liyanage Hardware',
    address: '591/1/A,Avissawella Road,Mulleriyawa,Sri Lanka',
    phone: '011 2578949',
    contactPerson: 'Mr. Liyanage',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Mulleriyawa'
  },
  {
    name: 'Perera Trade Waterproofing',
    address: 'Malabe,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Malabe'
  },
  {
    name: 'Priyankara Enterprise',
    address: 'No. 1264,Delupitiya Road, HunupitiyaWattala,Sri Lanka',
    phone: '0112 938 040',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Wattala'
  },
  {
    name: 'Redelle Stores',
    address: 'Redelle Permurugama,Sri Lanka',
    phone: '011 2236682',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 05',
    location: 'Palamurugama'
  },
  {
    name: 'Uni Royal Enterprises',
    address: 'AbdulJabber mawateh Colombo 07,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Krishana Kumar',
    contactMobile: '077 3413629',
    zone: 'Zone 01',
    location: 'Colombo'
  },
  {
    name: 'Agaleewatta Plantation',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: 'Agalawatta'
  },
  {
    name: 'Dhakshina Paint Center',
    address: 'No. 570/A,Kandy Road,Nittambuwa,Sri Lanka',
    phone: '0332 298 109',
    contactPerson: 'Mr. Athula',
    contactMobile: '077 774 0183',
    zone: 'Zone 01',
    location: 'Nittambuwa'
  },
  {
    name: 'Jayasuriya Hardward',
    address: 'No.141,Dambuwa, Minuwangoda Rd,E-Kala,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Ekala'
  },
  {
    name: 'Perera HW',
    address: '757, AnuradhapuraDambulla,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Perera',
    contactMobile: '074 0171534',
    zone: 'Zone 04',
    location: 'Dambulla'
  },
  {
    name: 'Rainbow Paint Center',
    address: 'No. 170,Main Street,Dharga Town,Sri Lanka',
    phone: '0342 275 575',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Dharga Town'
  },
  {
    name: 'Salika Engineering',
    address: 'Hansagiri road,Gampaha,Sri Lanka',
    phone: '',
    contactPerson: 'Mr.Pradeep',
    contactMobile: '077 7635166',
    zone: 'Zone 01',
    location: 'Gampaha'
  },
  {
    name: 'Warna Paint House',
    address: 'No 111,Yatanwella,Ruwanwella,Sri Lanka',
    phone: '036 7856655',
    contactPerson: 'Mr.Pradeep',
    contactMobile: '077 1778030',
    zone: 'Zone 03',
    location: 'Ruwanwella'
  },
  {
    name: 'Wickrama Hardware & Trading (Pvt) Ltd',
    address: 'No.01,Walpole Road,Aggona,Angoda,Sri Lanka',
    phone: '0112 793 148',
    contactPerson: 'Ms. Chalani Wickramarachchi',
    contactMobile: '0112 793 148',
    zone: 'Zone 01',
    location: 'Angoda'
  },
  {
    name: 'ASG Paints & Hardware',
    address: 'No. 67, Biyagama Rd, GonawalaKelaniya,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: 'Zone 01',
    location: 'Kelaniya'
  },
  {
    name: 'Colour Plus Paint Shop',
    address: 'No. 11/D,Kurunagala Road ,Polgahawela,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Upul',
    contactMobile: '077 317 8434',
    zone: 'Zone 04',
    location: 'Polgahawela'
  },
  {
    name: 'Darshana Hardware',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'G.S.W. Stores',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'Huru HW',
    address: '',
    phone: '021 2286111',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'Kandy Waterproofing',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'Lanka Steel',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'Midland Hardware',
    address: 'No 05,Main Street, WellawayaWellawaya,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Safeec',
    contactMobile: '077 6675999',
    zone: 'Zone 03',
    location: 'Wellawaya'
  },
  {
    name: 'Rathnayaka Hardware',
    address: 'Rathnayaka Hardware,Sri Lanka',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'SDR Hardware',
    address: 'Bandarawela road, Divithotawela,Welimada,Sri Lanka',
    phone: '',
    contactPerson: 'Mr.Gayan',
    contactMobile: '077 6484387',
    zone: 'Zone 03',
    location: 'Welimada'
  },
  {
    name: 'Senuhas Paint Master',
    address: '#687/1/4,Puwakgahahandiya,Dadigamuwa,Ambulgama Road,PanagodaSri Lanka',
    phone: '',
    contactPerson: 'Mr.Danuka',
    contactMobile: '075 2228828',
    zone: 'Zone 01',
    location: 'Panagoda'
  },
  {
    name: 'Tesco International',
    address: '',
    phone: '',
    contactPerson: '',
    contactMobile: '',
    zone: '',
    location: ''
  },
  {
    name: 'Universal Hardware',
    address: '153 A, Main Street, Bandarawela,Bandarawela,Sri Lanka',
    phone: '',
    contactPerson: 'Mr. Aruna',
    contactMobile: '077 7931901',
    zone: 'Zone 03',
    location: 'Bandarawela'
  }
];

const seedHardwares = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < hardwaresList.length; i++) {
      const h = hardwaresList[i];
      const trimmedName = h.name.trim();
      
      // Look if hardware store exists in database by name
      let member = await Member.findOne({ 
        memberName: { $regex: new RegExp('^' + trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } 
      });

      const hardwareAddress = h.address || '';
      const phone = h.phone || '';
      const whatsappNumber = phone; // default same
      const contactPersonName = h.contactPerson || '';
      const contactPersonMobile = h.contactMobile || '';
      const zone = h.zone || '';
      const location = h.location || '';

      if (!member) {
        // Generate neat incremental memberId: MH0001, MH0002, etc.
        const idNumber = (i + 1).toString().padStart(4, '0');
        const generatedMemberId = `MH${idNumber}`;

        member = new Member({
          memberId: generatedMemberId,
          memberName: trimmedName,
          phone,
          whatsappNumber,
          role: 'applicator',
          location,
          hardwareAddress,
          contactPersonName,
          contactPersonMobile,
          zone,
          equipment: 'Hardware',
          points: 0,
          tier: 'bronze',
          condition: 'good',
          notes: 'Seeded from Hardware stores data sheet'
        });

        await member.save();
        createdCount++;
        console.log(`   [+] Created MH${idNumber}: ${trimmedName}`);
      } else {
        // Update details if already exists
        member.phone = phone || member.phone;
        member.whatsappNumber = whatsappNumber || member.whatsappNumber;
        member.location = location || member.location;
        member.hardwareAddress = hardwareAddress || member.hardwareAddress;
        member.contactPersonName = contactPersonName || member.contactPersonName;
        member.contactPersonMobile = contactPersonMobile || member.contactPersonMobile;
        member.zone = zone || member.zone;
        member.equipment = 'Hardware';
        
        await member.save();
        updatedCount++;
        console.log(`   [*] Updated ${member.memberId}: ${trimmedName}`);
      }
    }

    console.log(`\n✅ Seeding complete! Created: ${createdCount}, Updated: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedHardwares();
