/**
 * Medak Constituency Location Data
 * Hierarchical structure: Districts → Assemblies → Mandals → Villages
 * MP: Madhavaneni Raghunandan Rao
 */

export interface Village {
  id: string;
  name: string;
}

export interface Mandal {
  id: string;
  name: string;
  villages: string[];
}

export interface Assembly {
  id: string;
  name: string;
  mandals: Mandal[];
}

export interface District {
  id: string;
  name: string;
  assemblies: Assembly[];
}

export interface MedakConstituencyData {
  districts: District[];
}

export const medakLocations: MedakConstituencyData = {
  districts: [
    {
      id: 'siddipet',
      name: 'Siddipet District',
      assemblies: [
        {
          id: 'dubbak',
          name: 'Dubbak Assembly',
          mandals: [
            {
              id: 'dubbak-municipality',
              name: 'Dubbak Municipality',
              villages: [
                'Dharmajipet',
                'Lachapet',
                'Chervapur',
                'Dubbak',
                'Chellapur',
                'Dumpalaplly',
                'Mallaipally'
              ]
            },
            {
              id: 'dubbak-rural',
              name: 'Dubbak Rural',
              villages: [
                'Gambhirpur',
                'Potharam',
                'Shilaji Nagar',
                'Venkatagiri Thanda',
                'Gosanpally',
                'Akaram',
                'Raghthampally',
                'Cheekode',
                'Achumaipally',
                'Kammarpalli',
                'Ramakkapet',
                'Arepally',
                'Yellapur',
                'Balvathapoor',
                'Padmashaligadda',
                'Habshipur',
                'Thimmapur',
                'Padmanabhunipally',
                'Pedda Gundavelli',
                'Appanapalii',
                'Hasan Mirapur'
              ]
            },
            {
              id: 'akbarpet-bhoomally',
              name: 'Akbarpet–Bhoompally',
              villages: [
                'Boppapur',
                'Enagurthi',
                'Chinna Nizampet',
                'Rameshrampaliy',
                'Kudavelli',
                'Thallapally',
                'Nagaram',
                'Akberpet',
                'Pothareddipet',
                'Chowdharpally',
                'Chittapur',
                'Bhoompally',
                'Khaipur',
                'Begumpet',
                'Mothey',
                'Rudraram',
                'Jangapally',
                'Almaspur',
                'Verareddypally'
              ]
            },
            {
              id: 'mirdoddi',
              name: 'Mirdoddi',
              villages: [
                'Kasulabad',
                'Mallupally',
                'Mirdoddi',
                'Laxmi Nagar',
                'Arepally (Laxmi Nagar GP)',
                'Dharamaram',
                'Kondapur',
                'Andey',
                'Alwal',
                'Lingupally',
                'Chepial'
              ]
            },
            {
              id: 'thoguta',
              name: 'Thoguta',
              villages: [
                'Gudikandula',
                'Govardhanagiri',
                'Vardharajpally',
                'L Banjerpally',
                'Lingapur',
                'ZP Lingareddipally',
                'Kangal',
                'Thukkapur',
                'Ghanpur',
                'Bandarupally',
                'Yellareddipet',
                'Pedda Masanpally',
                'Thoguta',
                'Rampur',
                'Lingampet',
                'Venkatraopet',
                'Chandapur'
              ]
            },
            {
              id: 'rayapole',
              name: 'Rayapole',
              villages: [
                'Ramaram',
                'Sayyad Nagar',
                'Gollapally',
                'Tenkampet',
                'Waddepally',
                'Veerareddypally',
                'Begumpet',
                'Yelkal',
                'Ramsagar',
                'Mungojupally',
                'Ankireddypally',
                'Veera Nagar',
                'S J Arepally',
                'Arepally SB (Gajwel Mandal)',
                'Lingareddipally',
                'Kothapally',
                'Rayapole',
                'Thimmakpally',
                'Mantoor',
                'Anajipur',
                'Chinna Masanpally'
              ]
            },
            {
              id: 'doulthabad',
              name: 'Doulthabad',
              villages: [
                'Guvvalegi',
                'Upperpally',
                'Govindapur',
                'Konaipally',
                'Surampally',
                'Muthyampet',
                'Lingarajpally',
                'Dommat',
                'Gajulapally',
                'Mubharaspur',
                'Malleshampally',
                'Tirumalapoor',
                'Mandapur',
                'Deepayampally',
                'Konapur',
                'Bandaram Narsampet',
                'Sheripally Bandaram',
                'Lingayapally Thanda',
                'Gudugupally',
                'Chetla Narsampally (PD)',
                'Indupriya',
                'Machinpally',
                'Appaiapally',
                'Doulthabad'
              ]
            }
          ]
        },
        {
          id: 'gajwel',
          name: 'Gajwel Assembly',
          mandals: [
            {
              id: 'gajwel-area',
              name: 'Gajwel Area',
              villages: [
                'Anthasagar',
                'Thimmapur',
                'Thigul',
                'Ram Nagar',
                'Chatlapalli',
                'Thigulla Narsapur',
                'Vattipalli',
                'Baswapur',
                'Aliraj Pet',
                'Gollapally',
                'Dowlapur',
                'Dharamaram',
                'Peerlapalli',
                'Itikyala',
                'Lingareddy Palli',
                'Jagdevpoor',
                'Munigadapa'
              ]
            },
            {
              id: 'kondapak',
              name: 'Kondapak Mandal',
              villages: [
                'Thimmareddy Pally',
                'Sirsigandla',
                'Marpadaga',
                'Giraipally',
                'Dammakkapalli',
                'Khammampalli',
                'Zapthi Nacharam',
                'Velikatta',
                'Duddeda',
                'Bandaram',
                'Ankireddipalli',
                'Kondapaka'
              ]
            },
            {
              id: 'kukunoorpally',
              name: 'Kukunoorpally Mandal',
              villages: [
                'Mangole',
                'Konayipalli',
                'Kukunoorpally',
                'Medinipur',
                'Mathpally',
                'Lakudaram',
                'Bobbaipalli',
                'Chinna Kishtapur',
                'Ramachandrapur',
                'Yellaiguda',
                'Venkatapur',
                'Rayavaram',
                'Muddapur',
                'Thipparam'
              ]
            },
            {
              id: 'manoharabad',
              name: 'Manoharabad Mandal',
              villages: [
                'Jeedipalli',
                'Dandupalli',
                'Manoharabad',
                'Ramaya Palli',
                'Venkatapur Agrahara',
                'Lingareddypet',
                'Palata',
                'Kucharam',
                'Mappireddypalli',
                'Kallakal',
                'Rangayipalli',
                'Chetla Gowraram',
                'Konayaipalli (PT)',
                'Kondapur'
              ]
            },
            {
              id: 'markook',
              name: 'Markook Mandal',
              villages: [
                'Nasannapet',
                'Angadi Kistapoor',
                'Erravelly',
                'Yousufkhanpally',
                'Damarkunta',
                'Karkapatla',
                'Kasireddypalli',
                'Markook',
                'Shivar Venkatapur',
                'Vardharaj Poor',
                'Bhavanandapoor',
                'Chebarthi',
                'Ippalaguda',
                'Pathur',
                'Pamulaparthy'
              ]
            },
            {
              id: 'mulugu',
              name: 'Mulugu Mandal',
              villages: [
                'Singannaguda',
                'Baswapur Izara',
                'Srirampur',
                'Narsapur',
                'Achaipalli',
                'Dasarlapalli',
                'Thuniki Bollaram',
                'Mamidyala',
                'Laxmakkapalli',
                'Chinna Timmapur',
                'Mulugu',
                'Bahilampur',
                'Thanderpally',
                'Kothur',
                'Kokonda',
                'Banda Mailaram',
                'Banda Thimmapur',
                'Cheelasagar',
                'Annasagar (H/o Chilasagar)',
                'Zapti Singaipalli',
                'Rangadhar Palli',
                'Nagireddy Palli',
                'Adavimajid',
                'Kotyala',
                'Narsampalli'
              ]
            },
            {
              id: 'toopran-municipality',
              name: 'Toopran Municipality',
              villages: [
                'Toopran',
                'Padalapally',
                'Brahmanapally',
                'Venkatapur',
                'Ravelli',
                'Potharajpally',
                'Allapur',
                'Puttakotla'
              ]
            },
            {
              id: 'toopran-mandal',
              name: 'Toopran Mandal',
              villages: [
                'Kistapur',
                'Yavaapur',
                'Gundreddipally',
                'Narsampally',
                'Venkatayapally',
                'Islampur',
                'Venkatarathnapur',
                'Datharpally',
                'Malkapur',
                'Konaipally',
                'Nagulapally',
                'Vattur',
                'Imampur',
                'Ghanapur'
              ]
            },
            {
              id: 'wargal',
              name: 'Wargal Mandal',
              villages: [
                'Gouraram',
                'Nagaram Thanda',
                'Amberpet',
                'Shaakaram',
                'Seetharampally',
                'Mylaram Maktha',
                'Chowdharpally',
                'Singayapally',
                'Nacharam-1',
                'Ananthagirpally',
                'Gunti Pally',
                'Girmapur',
                'Govindapur',
                'Thuniki Kalsa',
                'Nemtoor',
                'Meenajipet',
                'Thuniki Maktha',
                'Jabbapur',
                'Mailaram',
                'Sherpalli',
                'Majeedpally',
                'Madharam',
                'Veluru',
                'Wargal'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'medak',
      name: 'Medak District',
      assemblies: [
        {
          id: 'chegunta',
          name: 'Chegunta Assembly',
          mandals: [
            {
              id: 'chegunta-mandal',
              name: 'Chegunta Mandal',
              villages: [
                'B Kondapur',
                'Bonala',
                'Karnalpally',
                'Chandaipet',
                'Kasanpally',
                'Chittojipally',
                'Reddipally',
                'Anantha Sagar',
                'Uli Thimmaipally',
                'Chegunta',
                'Polampally',
                'Wadiyaram',
                'Gollapally',
                'Jaithram Thanda',
                'Makkarajpet',
                'Kistapur',
                'Pulimamidi',
                'Ibrahimpur',
                'Rukmapur',
                'Rampur (Somla Thanda)',
                'Karim Nagar',
                'Chinna Shivnoor',
                'Pedda Shivnoor'
              ]
            },
            {
              id: 'narsingi-mandal',
              name: 'Narsingi Mandal',
              villages: [
                'Narsingi',
                'Narsampally',
                'Vallabhapoor',
                'Vallur',
                'Bhimraopally'
              ]
            },
            {
              id: 'masaipet-mandal',
              name: 'Masaipet Mandal',
              villages: [
                'Masaipet',
                'Pothanshettiipally',
                'Pothanpally',
                'CH Thimmaipally',
                'Nadimi Thanda'
              ]
            }
          ]
        },
        {
          id: 'medak',
          name: 'Medak Assembly',
          mandals: [
            {
              id: 'papannapet',
              name: 'Papannapet Mandal',
              villages: [
                'Kompally',
                'Cheekod',
                'Kotha Lingayipally',
                'Patha Lingayipalli',
                'Amriya Thanda',
                'Mallampet',
                'Kandipally',
                'Ramathirtham',
                'Narsingraopally Thanda',
                'Muddapur',
                'Narsingi',
                'Arkela',
                'Dakya Thanda',
                'Papannapet',
                'Minpur',
                'Doulapur',
                'Kurthiwada',
                'Bacharam',
                'Seethanagar',
                'Namapur',
                'Yousufpet',
                'Kodpak',
                'Gajula Gudem',
                'Nagsanpally',
                'Sheripally',
                'Annaram',
                'Ablapur',
                'Kothapally',
                'Laxminagar',
                'Yellapur',
                'Thammaipally',
                'Podchanpally',
                'Gandharpally',
                'Jayapuram',
                'Podchanpally Thanda',
                'Enkepally',
                'Chitriyal'
              ]
            },
            {
              id: 'haveli-ghanpur',
              name: 'Haveli Ghanpur Mandal',
              villages: [
                'Sulthanpur',
                'Nagapur',
                'Jakkannapet',
                'Pochammaral',
                'Boguda Bhoopathipur',
                'Sardhana',
                'Fareedpur',
                'Muthaipally',
                'Maddulwai',
                'Kothapally',
                'Wadi',
                'Burugupally',
                'Gajireddypally',
                'Rajpet',
                'Kapraipally',
                'Shamnapur',
                'Gangapoor',
                'Haveli Ghanapur Thanda',
                'Shamnapur Thanda',
                'Aurangabad Thanda',
                'Lingasanipally',
                'Lingasanipally Thanda',
                'B Thimmaipally',
                'Byathole',
                'Haveli Ghanapur',
                'Choutlapally',
                'Thogita',
                'Kuchanpally'
              ]
            },
            {
              id: 'ch-shankarampet',
              name: 'CH. Shankarampet Mandal',
              villages: [
                'Shalipet',
                'Madoor',
                'Gajagatlapally',
                'Venkatraopalli',
                'Chennaipally',
                'Shankarampet (R)',
                'Ambajipet',
                'Turkala Mandapur',
                'S Kondapur',
                'Korvipally',
                'Japti Shivanoor',
                'Shankapur',
                'Sheripally',
                'Kamaram',
                'Kamaram Thanda',
                'Rudraram',
                'Chandampet',
                'Suraram',
                'Bhagirthipally',
                'Dharipally',
                'Mallupally',
                'Chandhapoor',
                'Jangarai',
                'Sangaipally',
                'Gavvalapally',
                'Nadimithanda',
                'Khajapur',
                'Khaja Thanda',
                'Mirzapally'
              ]
            },
            {
              id: 'nizampet',
              name: 'Nizampet Mandal',
              villages: [
                'Chelmeda',
                'Naskal',
                'Nanda Gokul',
                'Nagaram (Lt)',
                'Rampur',
                'Nizampet',
                'Bachhurajupalli',
                'Nandigama',
                'Jadcheruvu Thanda',
                'Kalvakunta',
                'Rajakpalli',
                'Narlapalli',
                'K Venkatapur',
                'Thippannagulla'
              ]
            },
            {
              id: 'ramayampet-town',
              name: 'Ramayampet Town',
              villages: [
                'Ramayampet',
                'Komatpally',
                'Golparthy'
              ]
            },
            {
              id: 'ramayampet-mandal',
              name: 'Ramayampet Mandal',
              villages: [
                'Dongal Dharamaram',
                'Akkannapet',
                'Jansi Lingapoor',
                'Rayilapoor',
                'Sutharpally',
                'Parvathapoor',
                'Kishan Thanda',
                'Danthepalli',
                'Katriyal',
                'Akkanapet',
                'Laxmapur',
                'Thonigandla',
                'Damera Cheruvu',
                'Konapur',
                'Venkatapur (R)',
                'Shivayipalli'
              ]
            },
            {
              id: 'medak-town',
              name: 'Medak Town',
              villages: [
                'Aurangabad',
                'Ausulapally',
                'Medak',
                'Pillikottal'
              ]
            },
            {
              id: 'medak-mandal',
              name: 'Medak Mandal',
              villages: [
                'Thimma Nagar',
                'Maktha Bhoopathipoor',
                'Malkapally Thanda',
                'Shivayipalli',
                'Guttakindi Pally',
                'Perur',
                'Ryaladugu',
                'Machavaram',
                'Mambojipalle',
                'Chityala',
                'Jamkampalli',
                'Pathur',
                'Rayanapally',
                'Khajipalli',
                'Rajpalli',
                'Bala Nagar'
              ]
            }
          ]
        },
        {
          id: 'narsapur',
          name: 'Narsapur Assembly',
          mandals: [
            {
              id: 'chilipiched',
              name: 'Chilipiched Mandal',
              villages: [
                'Chitkul',
                'Banjara Thanda',
                'Chandoor',
                'Gujri Thanda',
                'Gouthampoor',
                'Ganya Thanda',
                'Chilipiched',
                'Seelamplly',
                'Faizabad',
                'Bandapothugal',
                'Ajamarri',
                'Gangaram',
                'Jaggampet',
                'Sommakkapet',
                'Ramdas Guda',
                'Rahimguda',
                'Samla Thanda'
              ]
            },
            {
              id: 'narsapur-town',
              name: 'Narsapur Town',
              villages: [
                'Narsapur'
              ]
            },
            {
              id: 'narsapur-mandal',
              name: 'Narsapur Mandal',
              villages: [
                'Naagula Palli',
                'Moosapet',
                'Ibrahimbad',
                'Ahmamad Nagar',
                'Tujalpur',
                'Bramhanpally',
                'Tirmulpoor',
                'Gollapally',
                'Lingapur',
                'Achampet',
                'Narayanpur',
                'Chinna Chintakunta',
                'Pedda Chinthakunta',
                'Reddypally',
                'Manthoor',
                'Khajipeta',
                'Mahmmadabad',
                'Chippal Thurthi',
                'Jakkapally',
                'Admapoor',
                'Nathnay Pally',
                'Kagajmaddur',
                'Kondapur',
                'Yellapur',
                'Avancha',
                'Madapur',
                'Narsapur',
                'Ramachandrapur',
                'Rustumpeta',
                'Saitarampur'
              ]
            },
            {
              id: 'shivampet',
              name: 'Shivampet Mandal',
              villages: [
                'Konthanpally',
                'Danthanpally',
                'Gundlapally',
                'Pothula Boguda',
                'Usirika Pally',
                'Shankar Thanda',
                'Pambanda',
                'Bheemla Thanda',
                'Ratnapur',
                'Seetaram Thanda',
                'Kothapet',
                'Allipur',
                'Rupla Thanda',
                'Pilutla',
                'Lingoji Guda',
                'Shivampet',
                'Eddulapoor',
                'Gudur',
                'Nanthanda',
                'Thallapalli',
                'Donthi',
                'Mallupally',
                'Potharam',
                'Parikibanda',
                'Gangaipally',
                'Bijlipur',
                'Sikindlapur',
                'Shabashpally',
                'Magdampur',
                'Chandi',
                'Bojya Thanda',
                'Redya Thanda',
                'Timmapur',
                'Chinna Gottimukala',
                'Pedda Gottimukala',
                'Chennapur',
                'Tikya Devama Gudem Thanda',
                'Nawabpet',
                'Lachireddy Gudem',
                'Gomaram'
              ]
            },
            {
              id: 'yeldurthy',
              name: 'Yeldurthy Mandal',
              villages: [
                'Shettipally Kalan',
                'Ramayipally',
                'Edulapally',
                'Uppu Lingapur',
                'Mellur',
                'Peddapur',
                'Hastalpur',
                'Shamshiredy',
                'Yeldurthi',
                'Cherlapalli',
                'Aregudem',
                'Baswappur',
                'Eshvantharopet',
                'Mannevar Jalapur',
                'Kuknoor',
                'Dharmarancha',
                'Andugula Palli',
                'Dharmarama',
                'Manepalli',
                'Mangalaparthi'
              ]
            },
            {
              id: 'masaipet',
              name: 'Masaipet Mandal',
              villages: [
                'Masaipet',
                'Bommarama',
                'Koppulapalli',
                'Lingareddy Palli',
                'Achampet',
                'Hakimpet',
                'Ramanthapur'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'sangareddy',
      name: 'Sangareddy District',
      assemblies: [
        {
          id: 'sangareddy',
          name: 'Sangareddy Assembly',
          mandals: [
            {
              id: 'sangareddy-municipality',
              name: 'Sangareddy Municipality',
              villages: [
                'Sangareddy',
                'Nethaji Nagar',
                'Bhagathsingh Nagar',
                'Brahmanwada',
                'Babanagar'
              ]
            },
            {
              id: 'sangareddy-mandal',
              name: 'Sangareddy Mandal',
              villages: [
                'Kalabgoor',
                'Angadipeta',
                'Thalapally',
                'Fasalwaadi',
                'Gudithanda',
                'Hanuman Nagar',
                'Eshwarapuram',
                'Ismailkhanpet',
                'Chintalapally',
                'Irigipally',
                'Thogaripalli',
                'Mohemad Shapur'
              ]
            },
            {
              id: 'sadashivapet-municipality',
              name: 'Sadashivapet Municipality',
              villages: [
                'Sadashivpet'
              ]
            },
            {
              id: 'sadashivapet-mandal',
              name: 'Sadashivapet Mandal',
              villages: [
                'Pottipalli',
                'Kolkoor',
                'Melgiripet',
                'Sooraram',
                'Thangedpally',
                'Gollagudem',
                'Nandikandi',
                'Babil Gaon',
                'Yatigaddasangam',
                'Malaphad',
                'Nizampur',
                'Venkatapoor',
                'Ishritabad',
                'Ankepally',
                'Yenkepally',
                'Chandapur',
                'Athmakur',
                'Veltoor',
                'Mubarakpoor-A',
                'Maddikunta',
                'Kambalapally',
                'Rejinthal',
                'Aroor',
                'Yellaram',
                'Peddapur',
                'Nandikandi'
              ]
            }
          ]
        },
        {
          id: 'patancheru',
          name: 'Patancheru Assembly',
          mandals: [
            {
              id: 'bharathi-nagar',
              name: 'Bharathi Nagar (111 Division)',
              villages: [
                'Ranganathapuram',
                'LIG',
                'H.I.G.I',
                'Bombay Colony',
                'Srinivas Nagar Colony',
                'Annamaih Enclave',
                'Kachireddy Pally',
                'B.H.E.L'
              ]
            },
            {
              id: 'ramachandrapuram',
              name: 'Ramachandrapuram (112 Division)',
              villages: [
                'Ramachandrapuram'
              ]
            },
            {
              id: 'ameenpur-municipality',
              name: 'Ameenpur Municipality',
              villages: [
                'Beeramguda',
                'Ammenpur',
                'Bandamkommu',
                'KSR NRI Colony',
                'Uske Bavi'
              ]
            },
            {
              id: 'tellapur-municipality',
              name: 'Tellapur Municipality',
              villages: [
                'Tellapur',
                'Indira Nagar',
                'Eedulanagulapally',
                'Velimela'
              ]
            },
            {
              id: 'bollaram-municipality',
              name: 'Bollaram Municipality',
              villages: [
                'Bollaram'
              ]
            },
            {
              id: 'patancheru-mandal',
              name: 'Patancheru Mandal',
              villages: [
                'Rameshwaram Banda',
                'Indresham',
                'Pedda Kanjera',
                'Lakdaram',
                'Bachuguda',
                'Pocharam',
                'Chinna Kanjera',
                'Muthangi',
                'Isnapur',
                'Rudraram',
                'Pashamailaram',
                'Bhanoor',
                'Nandigama',
                'Ganapur',
                'Pati'
              ]
            },
            {
              id: 'patancheru-urban',
              name: 'Patancheru Urban Areas',
              villages: [
                'JP Colony',
                'Ambedkar Colony',
                'Mangali Basthi',
                'Kammargalli',
                'Sai Ram Nagar',
                'Bhagath Galli',
                'Shanti Nagar',
                'Goutham Nagar',
                'Raghavendra Colony',
                'Sai Raghavendra Colony',
                'Kindi Basthi',
                'Mudhiraj Basti',
                'Malket Basthi',
                'APR Colony',
                'Golla Basthi',
                'Srinagar Colony',
                'Sriram Nagar',
                'Patancheru',
                'Bandlaguda'
              ]
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Helper functions for location queries
 */

// Get all districts
export const getDistricts = (): District[] => {
  return medakLocations.districts;
};

// Get assemblies by district ID
export const getAssembliesByDistrict = (districtId: string): Assembly[] => {
  const district = medakLocations.districts.find(d => d.id === districtId);
  return district ? district.assemblies : [];
};

// Get mandals by assembly ID
export const getMandalsByAssembly = (districtId: string, assemblyId: string): Mandal[] => {
  const district = medakLocations.districts.find(d => d.id === districtId);
  if (!district) return [];
  
  const assembly = district.assemblies.find(a => a.id === assemblyId);
  return assembly ? assembly.mandals : [];
};

// Get villages by mandal ID
export const getVillagesByMandal = (districtId: string, assemblyId: string, mandalId: string): string[] => {
  const district = medakLocations.districts.find(d => d.id === districtId);
  if (!district) return [];
  
  const assembly = district.assemblies.find(a => a.id === assemblyId);
  if (!assembly) return [];
  
  const mandal = assembly.mandals.find(m => m.id === mandalId);
  return mandal ? mandal.villages : [];
};

// Search for a location by name (fuzzy search)
export const searchLocation = (searchTerm: string): {
  district?: District;
  assembly?: Assembly;
  mandal?: Mandal;
  village?: string;
  type: 'district' | 'assembly' | 'mandal' | 'village';
}[] => {
  const results: any[] = [];
  const term = searchTerm.toLowerCase();

  medakLocations.districts.forEach(district => {
    // Search districts
    if (district.name.toLowerCase().includes(term)) {
      results.push({ district, type: 'district' });
    }

    district.assemblies.forEach(assembly => {
      // Search assemblies
      if (assembly.name.toLowerCase().includes(term)) {
        results.push({ district, assembly, type: 'assembly' });
      }

      assembly.mandals.forEach(mandal => {
        // Search mandals
        if (mandal.name.toLowerCase().includes(term)) {
          results.push({ district, assembly, mandal, type: 'mandal' });
        }

        // Search villages
        mandal.villages.forEach(village => {
          if (village.toLowerCase().includes(term)) {
            results.push({ district, assembly, mandal, village, type: 'village' });
          }
        });
      });
    });
  });

  return results;
};

// Get full location path for a village
export const getLocationPath = (villageName: string): {
  district: string;
  assembly: string;
  mandal: string;
  village: string;
} | null => {
  for (const district of medakLocations.districts) {
    for (const assembly of district.assemblies) {
      for (const mandal of assembly.mandals) {
        if (mandal.villages.includes(villageName)) {
          return {
            district: district.name,
            assembly: assembly.name,
            mandal: mandal.name,
            village: villageName
          };
        }
      }
    }
  }
  return null;
};

// Validate if a location hierarchy is valid
export const validateLocationHierarchy = (
  districtId: string,
  assemblyId: string,
  mandalId: string,
  villageName: string
): boolean => {
  const villages = getVillagesByMandal(districtId, assemblyId, mandalId);
  return villages.includes(villageName);
};