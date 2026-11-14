<!-- Fuente: https://ccmc.gsfc.nasa.gov/tools/DONKI/ · Dueño: NASA CCMC · Consultado: 2026-11-14 · Copia estática, no en vivo -->

1. [Home](/)
2. [CCMC Developed Web Apps/Tools](/tools)

Last Updated: 10/29/2026

CCMC DONKI System
=================

![](/gen/donki-page-icon.webp)

[Go to DONKI Web App

➞](https://ccmc.gsfc.nasa.gov/DONKI/)[DONKI-API doc

➞](/DONKI/api)[User Guide

➞](/DONKI/guide)

About
-----

The CCMC Space Weather **D**atabase **O**f **N**otifications, **K**nowledge, **I**nformation ([DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)) system is a comprehensive on-line tool for space weather forecasters, scientists, and the general space science community.

**DONKI Functionality:**

* Presents near real-time analyses of space weather observations, model outputs, and notifications, primarily by the Moon-to-Mars Space Weather Analysis Office ([M2M-SWAO](https://science.gsfc.nasa.gov/m2m-swao)).
* Offers advanced search capabilities within its knowledge base for anomaly resolution and scientific research.
* Establishes intelligent connections and relationships between various space weather events, including cause-and-effect.
* Provide comprehensive webservice API access to its stored information.

**DONKI Objectives:**

* Serve as a central online resource for space weather researchers and forecasters.
* Synthesize expert analyses of space weather events, capturing meaningful connections between activities.
* Facilitate remote engagement for students, international collaborators, and developers of models and forecasting methods.

**Accessing DONKI:**

* [DONKI Web Application](/DONKI/): Allows the general public to search, view, and visually explore interconnected space weather events within the database.
* [DONKI Web API](/DONKI/api/): Provides open, programmatic access for users and developers to query and retrieve space weather event data directly.
* DONKI-Editor (internal app): Serves as the data entry portal—primarily used by the Moon to Mars Space Weather Analysis Office (M2M-SWAO)—to log real-time events, record space weather analyses, and establish events linkages.

Latest News
-----------

* **September 30, 2026**: The DONKI web application and API have migrated to new official URLs, and the legacy standalone DONKI Dash URL will stop working.

  + Read the [full announcement](/news/major-updates/#donki--database-of-notifications--knowledge--information--system) for complete details.
  + User Support: Explore the updated interface with the [DONKI User's Guide](/DONKI/guide/).
  + Developer Resource: Review the latest [DONKI API Documentation](/DONKI/api/#description/introduction).
  + **Note**: Endpoint paths following /DONKI/ remain unchanged. Replacing *kauai.ccmc.gsfc.nasa.gov* with **ccmc.gsfc.nasa.gov** in existing links will route directly without modification.
* **May 2025**: Beta release of the new DONKI Dash for plotting events in the DONKI system from the M2M\_CATALOG incorporating relevant real-time observational data.

DONKI Webservice API
--------------------

[API Documentation

➞](/DONKI/api/)

DONKI Rules-of-the-Road
-----------------------

CCMC requests that event and validation studies with data from DONKI be performed with the knowledge and collaboration of the submitting forecasters/researchers, model developers, and CCMC. The Moon to Mars Space Weather Analysis Office (2020-present), CCMC (2010-2020) and other entities provide data to DONKI as a courtesy to the community. The real-time space weather information and simulations stored in DONKI should be considered only as prototyping quality and in research context. Please also review CCMC’s general [publication policy](https://ccmc.gsfc.nasa.gov/publication-policy/) for guidelines and sample acknowledgement statements.

Disclaimer
----------

Data and/or information stored within the CCMC DONKI is provided "as is" without any warranty of any kind, either expressed, implied, or statutory, including, but not limited to, any warranty that the data and/or information will conform to specifications, any implied warranties of merchantability, fitness for a particular purpose, or freedom from infringement, any warranty that the information will be error free, or any warranty that documentation, if provided, will conform to the data and/or information. In no event shall the United States Government, or its contractors or subcontractors, be liable for any damages, including, but not limited to, direct, indirect, special or consequential damages, arising out of, resulting from, or in any way connected with this information, whether or not based upon warranty, contract, tort, or otherwise, whether or not injury was sustained by persons or property or otherwise, and whether or not loss was sustained from, or arose out of the results of, or use of, the data and/or information. The United States Government disclaims all warranties and liabilities regarding third party data and/or information, if present in the data and/or information generated and/or compiled by CCMC DONKI, and distributes it "as is".

Use of data and/or information stored within the CCMC DONKI does not, in any manner, constitute an endorsement by NASA of any test results, resulting designs, hardware, or other matters. Use of data and/or information stored within the CCMC DONKI does not, in any manner, constitute the grant of a license to RECIPIENT under any NASA copyright, patent, patent application or other intellectual property.

The terms of this disclaimer shall be construed, and the legal relations between the parties hereto shall be determined, in accordance with United States federal law.

NOAA [Space Weather Prediction Center](https://www.spaceweather.gov/) is the United States Government official source for space weather forecasts. This "Experimental Research Information" consists of preliminary NASA research products and should be interpreted and used accordingly.

Catalogs in DONKI
-----------------

**M2M\_CATALOG** (previously known as the *SWRC\_CATALOG*): This is the **primary catalog** in DONKI. All entries capture under this catalog **starting June 2020 to present** are events analyzed and captured by [**the Moon-to-Mars (M2M) Space Weather Analysis Office**](https://science.gsfc.nasa.gov/m2m-swao) at GSFC. Prior to June 2020, they are analyzed and captured by the SWRC team as part of the CCMC Team.

Events under this catalog include Solar Flare (FLR), Solar Energetic Particle (SEP), Coronal Mass Ejection (CME) plus its analysis information, Interplanetary Shock (IPS), Magnetopause Crossing (MPC), Geomagnetic Storm (GST), Radiation Belt Enhancement (RBE), and Hight Speed Stream (HSS). It also includes all WSA-ENLIL+Cone Model results that the M2M team executes in near real-time as well as all notifications and reports generated by the M2M team.

**WINSLOW\_MESSENGER\_ICME\_CATALOG**: The interplanetary coronal mass ejection (ICME) catalog lists all 61 ICMEs observed by the MESSENGER Magnetometer (MAG) starting on 23 March 2011 and extending through 17 September 2014 that met the strict identiﬁcation criteria described in the paper, <https://doi.org/10.1002/2015JA021200>. This catalog in DONKI consists of the arrival information or Interplanetary Shock (IPS) at MESSENGER for the list of ICMEs included in the paper.

**SWPC\_ANNEX\_CME\_CATALOG**: This CME catalog contains 38 operationally measured CMEs by SWPC (2012-2014, 2017-2019) that were used in a [CCMC-SWPC validation study of CME arrival time](/annex/). All 38 events are available to view from CCMC's public DONKI database via an API in [text](/DONKI-API/get/CMEAnalysis.txt?startDate=2012-01-01&endDate=2019-03-20&mostAccurateOnly=false&keyword=swpc_annex) or [JSON](/DONKI-API/get/CMEAnalysis/?startDate=2012-01-01&endDate=2019-03-20&mostAccurateOnly=false&keyword=swpc_annex) format (if you are prompted for a password, please click the link again and it will bypass the login screen).

**SEPVAL\_CME\_CATALOG**: This Flare and CME catalog contains CME inputs use as part of the [SEPVAL challenges](/challenges/sep/). These CME parameters have been double checked by the M2M SWAO and updated if needed to ensure quality across.

**MAVEN\_EUVM\_FLARE\_CATALOG**: This Flare catalog was generated by using the Extreme UltraViolet Monitor (EUVM) onboard NASA’s Mars Atmosphere and Volatile Evolution ([MAVEN](https://lasp.colorado.edu/maven/)) mission. These events and timings are measured by the EUVM Diode-A, which has contributions are the soft X-rays (0-7nm) and EUV (17-22nm) wavelengths. For flare equivalent classes of Class C5 and larger, this Diode A band is dominated by the soft X-ray component and correlates well with the NOAA GOES XRS-B channel (0.1-0.8 nm). Prior to Dec 2018, the third channel, Diode-B, was available but failed on this date so is no longer available. Diode-B is a pure 0-7nm soft X-ray channel and is used for the flare identification when available. ***Note***: MAVEN is not an operational satellite, and does not have constant, or even regular, contacts. EUVM data downlink is dependent on DSN availability and contact schedule, so there may be a delay of hours or days between contacts. **Data Usage**: These data are quick look data and should not be used for analysis or publication. Please use the official MAVEN/EUVM data products located at the  [Planetary Data System (PDS)](https://pds.nasa.gov/datasearch/data-search/).

Reference
---------

For the CMEs in the 'M2M\_CATALOG', the 'Type' field refers to the CME SCORE Scale. This is a categorization of CMEs based on speed and frequency of occurrence. See the paper below when the SCORE Scale was developed:

[Evans, R. M., A. A. Pulkkinen, Y. Zheng, M. Leila Mays, A. Taktakishvili, M. M. Kuznetsova, and M. Hesse (2013), The SCORE Scale: A Coronal Mass Ejection Typiﬁcation System Based On Speed, Space Weather, 11, 333–334, doi:10.1002/swe.20058.](https://doi.org/10.1002/swe.20058)

#### **Sections in this page**

* [About](/tools/DONKI/#about)
* [Latest News](/tools/DONKI/#latest-news)
* [DONKI Webservice API](/tools/DONKI/#donki-webservice-api)
* [DONKI Rules-of-the-Road](/tools/DONKI/#donki-rules-of-the-road)
* [Disclaimer](/tools/DONKI/#disclaimer)
* [Catalogs in DONKI](/tools/DONKI/#catalogs-in-donki)
* [Reference](/tools/DONKI/#reference)

#### Sections in this page

* [About](/tools/DONKI/#about)
* [Latest News](/tools/DONKI/#latest-news)
* [DONKI Webservice API](/tools/DONKI/#donki-webservice-api)
* [DONKI Rules-of-the-Road](/tools/DONKI/#donki-rules-of-the-road)
* [Disclaimer](/tools/DONKI/#disclaimer)
* [Catalogs in DONKI](/tools/DONKI/#catalogs-in-donki)
* [Reference](/tools/DONKI/#reference)

CCMC DONKI System
=================

![](/gen/donki-page-icon.webp)

[Go to DONKI Web App

➞](https://ccmc.gsfc.nasa.gov/DONKI/)[DONKI-API doc

➞](/DONKI/api)[User Guide

➞](/DONKI/guide)

About
-----

The CCMC Space Weather **D**atabase **O**f **N**otifications, **K**nowledge, **I**nformation ([DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)) system is a comprehensive on-line tool for space weather forecasters, scientists, and the general space science community.

**DONKI Functionality:**

* Presents near real-time analyses of space weather observations, model outputs, and notifications, primarily by the Moon-to-Mars Space Weather Analysis Office ([M2M-SWAO](https://science.gsfc.nasa.gov/m2m-swao)).
* Offers advanced search capabilities within its knowledge base for anomaly resolution and scientific research.
* Establishes intelligent connections and relationships between various space weather events, including cause-and-effect.
* Provide comprehensive webservice API access to its stored information.

**DONKI Objectives:**

* Serve as a central online resource for space weather researchers and forecasters.
* Synthesize expert analyses of space weather events, capturing meaningful connections between activities.
* Facilitate remote engagement for students, international collaborators, and developers of models and forecasting methods.

**Accessing DONKI:**

* [DONKI Web Application](/DONKI/): Allows the general public to search, view, and visually explore interconnected space weather events within the database.
* [DONKI Web API](/DONKI/api/): Provides open, programmatic access for users and developers to query and retrieve space weather event data directly.
* DONKI-Editor (internal app): Serves as the data entry portal—primarily used by the Moon to Mars Space Weather Analysis Office (M2M-SWAO)—to log real-time events, record space weather analyses, and establish events linkages.

Latest News
-----------

* **September 30, 2026**: The DONKI web application and API have migrated to new official URLs, and the legacy standalone DONKI Dash URL will stop working.

  + Read the [full announcement](/news/major-updates/#donki--database-of-notifications--knowledge--information--system) for complete details.
  + User Support: Explore the updated interface with the [DONKI User's Guide](/DONKI/guide/).
  + Developer Resource: Review the latest [DONKI API Documentation](/DONKI/api/#description/introduction).
  + **Note**: Endpoint paths following /DONKI/ remain unchanged. Replacing *kauai.ccmc.gsfc.nasa.gov* with **ccmc.gsfc.nasa.gov** in existing links will route directly without modification.
* **May 2025**: Beta release of the new DONKI Dash for plotting events in the DONKI system from the M2M\_CATALOG incorporating relevant real-time observational data.

DONKI Webservice API
--------------------

[API Documentation

➞](/DONKI/api/)

DONKI Rules-of-the-Road
-----------------------

CCMC requests that event and validation studies with data from DONKI be performed with the knowledge and collaboration of the submitting forecasters/researchers, model developers, and CCMC. The Moon to Mars Space Weather Analysis Office (2020-present), CCMC (2010-2020) and other entities provide data to DONKI as a courtesy to the community. The real-time space weather information and simulations stored in DONKI should be considered only as prototyping quality and in research context. Please also review CCMC’s general [publication policy](https://ccmc.gsfc.nasa.gov/publication-policy/) for guidelines and sample acknowledgement statements.

Disclaimer
----------

Data and/or information stored within the CCMC DONKI is provided "as is" without any warranty of any kind, either expressed, implied, or statutory, including, but not limited to, any warranty that the data and/or information will conform to specifications, any implied warranties of merchantability, fitness for a particular purpose, or freedom from infringement, any warranty that the information will be error free, or any warranty that documentation, if provided, will conform to the data and/or information. In no event shall the United States Government, or its contractors or subcontractors, be liable for any damages, including, but not limited to, direct, indirect, special or consequential damages, arising out of, resulting from, or in any way connected with this information, whether or not based upon warranty, contract, tort, or otherwise, whether or not injury was sustained by persons or property or otherwise, and whether or not loss was sustained from, or arose out of the results of, or use of, the data and/or information. The United States Government disclaims all warranties and liabilities regarding third party data and/or information, if present in the data and/or information generated and/or compiled by CCMC DONKI, and distributes it "as is".

Use of data and/or information stored within the CCMC DONKI does not, in any manner, constitute an endorsement by NASA of any test results, resulting designs, hardware, or other matters. Use of data and/or information stored within the CCMC DONKI does not, in any manner, constitute the grant of a license to RECIPIENT under any NASA copyright, patent, patent application or other intellectual property.

The terms of this disclaimer shall be construed, and the legal relations between the parties hereto shall be determined, in accordance with United States federal law.

NOAA [Space Weather Prediction Center](https://www.spaceweather.gov/) is the United States Government official source for space weather forecasts. This "Experimental Research Information" consists of preliminary NASA research products and should be interpreted and used accordingly.

Catalogs in DONKI
-----------------

**M2M\_CATALOG** (previously known as the *SWRC\_CATALOG*): This is the **primary catalog** in DONKI. All entries capture under this catalog **starting June 2020 to present** are events analyzed and captured by [**the Moon-to-Mars (M2M) Space Weather Analysis Office**](https://science.gsfc.nasa.gov/m2m-swao) at GSFC. Prior to June 2020, they are analyzed and captured by the SWRC team as part of the CCMC Team.

Events under this catalog include Solar Flare (FLR), Solar Energetic Particle (SEP), Coronal Mass Ejection (CME) plus its analysis information, Interplanetary Shock (IPS), Magnetopause Crossing (MPC), Geomagnetic Storm (GST), Radiation Belt Enhancement (RBE), and Hight Speed Stream (HSS). It also includes all WSA-ENLIL+Cone Model results that the M2M team executes in near real-time as well as all notifications and reports generated by the M2M team.

**WINSLOW\_MESSENGER\_ICME\_CATALOG**: The interplanetary coronal mass ejection (ICME) catalog lists all 61 ICMEs observed by the MESSENGER Magnetometer (MAG) starting on 23 March 2011 and extending through 17 September 2014 that met the strict identiﬁcation criteria described in the paper, <https://doi.org/10.1002/2015JA021200>. This catalog in DONKI consists of the arrival information or Interplanetary Shock (IPS) at MESSENGER for the list of ICMEs included in the paper.

**SWPC\_ANNEX\_CME\_CATALOG**: This CME catalog contains 38 operationally measured CMEs by SWPC (2012-2014, 2017-2019) that were used in a [CCMC-SWPC validation study of CME arrival time](/annex/). All 38 events are available to view from CCMC's public DONKI database via an API in [text](/DONKI-API/get/CMEAnalysis.txt?startDate=2012-01-01&endDate=2019-03-20&mostAccurateOnly=false&keyword=swpc_annex) or [JSON](/DONKI-API/get/CMEAnalysis/?startDate=2012-01-01&endDate=2019-03-20&mostAccurateOnly=false&keyword=swpc_annex) format (if you are prompted for a password, please click the link again and it will bypass the login screen).

**SEPVAL\_CME\_CATALOG**: This Flare and CME catalog contains CME inputs use as part of the [SEPVAL challenges](/challenges/sep/). These CME parameters have been double checked by the M2M SWAO and updated if needed to ensure quality across.

**MAVEN\_EUVM\_FLARE\_CATALOG**: This Flare catalog was generated by using the Extreme UltraViolet Monitor (EUVM) onboard NASA’s Mars Atmosphere and Volatile Evolution ([MAVEN](https://lasp.colorado.edu/maven/)) mission. These events and timings are measured by the EUVM Diode-A, which has contributions are the soft X-rays (0-7nm) and EUV (17-22nm) wavelengths. For flare equivalent classes of Class C5 and larger, this Diode A band is dominated by the soft X-ray component and correlates well with the NOAA GOES XRS-B channel (0.1-0.8 nm). Prior to Dec 2018, the third channel, Diode-B, was available but failed on this date so is no longer available. Diode-B is a pure 0-7nm soft X-ray channel and is used for the flare identification when available. ***Note***: MAVEN is not an operational satellite, and does not have constant, or even regular, contacts. EUVM data downlink is dependent on DSN availability and contact schedule, so there may be a delay of hours or days between contacts. **Data Usage**: These data are quick look data and should not be used for analysis or publication. Please use the official MAVEN/EUVM data products located at the  [Planetary Data System (PDS)](https://pds.nasa.gov/datasearch/data-search/).

Reference
---------

For the CMEs in the 'M2M\_CATALOG', the 'Type' field refers to the CME SCORE Scale. This is a categorization of CMEs based on speed and frequency of occurrence. See the paper below when the SCORE Scale was developed:

[Evans, R. M., A. A. Pulkkinen, Y. Zheng, M. Leila Mays, A. Taktakishvili, M. M. Kuznetsova, and M. Hesse (2013), The SCORE Scale: A Coronal Mass Ejection Typiﬁcation System Based On Speed, Space Weather, 11, 333–334, doi:10.1002/swe.20058.](https://doi.org/10.1002/swe.20058)
