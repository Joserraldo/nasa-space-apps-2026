<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «DONKI») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# DONKI

The [Space Weather Database Of Notifications, Knowledge, Information (DONKI)](https://ccmc.gsfc.nasa.gov/tools/DONKI/) is a comprehensive on-line tool for space weather forecasters, scientists, and the general space science community. DONKI chronicles the daily interpretations of space weather observations, analysis, models, forecasts, and notifications provided by the Space Weather Research Center (SWRC), comprehensive knowledge-base search functionality to support anomaly resolution and space science research, intelligent linkages, relationships, cause-and-effects between space weather activities and comprehensive webservice API access to information stored in DONKI.

This API consists of the following component services:

| API | Example |
| --- | --- |
| [Coronal Mass Ejection (CME)](#donkiCME) | [https://api.nasa.gov/DONKI/CME?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/CME?startDate=2017-01-03&endDate=2017-01-03&api_key=DEMO_KEY) |
| [Coronal Mass Ejection (CME) Analysis](#donkiCMEAnalysis) | <https://api.nasa.gov/DONKI/CMEAnalysis?startDate=2016-09-01&endDate=2016-09-30&mostAccurateOnly=true&speed=500&halfAngle=30&catalog=ALL&api_key=DEMO_KEY> |
| [Geomagnetic Storm (GST)](#donkiGST) | [https://api.nasa.gov/DONKI/GST?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/GST?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY) |
| [Interplanetary Shock (IPS)](#donkiIPS) | [https://api.nasa.gov/DONKI/IPS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&location=LOCATION&catalog=CATALOG&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/IPS?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY) |
| [Solar Flare (FLR)](#donkiFLR) | [https://api.nasa.gov/DONKI/FLR?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/FLR?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY) |
| [Solar Energetic Particle (SEP)](#donkiSEP) | [https://api.nasa.gov/DONKI/SEP?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/SEP?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY) |
| [Magnetopause Crossing (MPC)](#donkiMPC) | [https://api.nasa.gov/DONKI/MPC?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/MPC?startDate=2016-01-01&endDate=2016-03-31&api_key=DEMO_KEY) |
| [Radiation Belt Enhancement (RBE)](#donkiRBE) | [https://api.nasa.gov/DONKI/RBE?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/RBE?startDate=2016-01-01&endDate=2016-01-31&api_key=DEMO_KEY) |
| [Hight Speed Stream (HSS)](#donkiHSS) | [https://api.nasa.gov/DONKI/HSS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/HSS?startDate=2016-01-01&endDate=2016-01-31&api_key=DEMO_KEY) |
| [WSA+EnlilSimulation](#donkiWSA) | [https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2016-01-06&endDate=2016-01-06&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2011-09-19&endDate=2011-09-20&api_key=DEMO_KEY) |
| [Notifications](#donkiNotifications) | <https://api.nasa.gov/DONKI/notifications?startDate=2014-05-01&endDate=2014-05-08&type=all&api_key=DEMO_KEY> |

## Coronal Mass Ejection (CME)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/CME?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/CME?startDate=2017-01-03&endDate=2017-01-03&api_key=DEMO_KEY)

## Coronal Mass Ejection (CME) Analysis

**startDate:** default 30 days prior to current UTC time  
 **endDate:** default to current UTC time  
 **mostAccurateOnly:** default is set to true  
 **completeEntryOnly:** default is set to true  
 **speed (lower limit):** default is set to 0  
 **halfAngle (lower limit):** default is set to 0  
 **catalog:** default is set to ALL (choices: ALL, SWRC\_CATALOG, JANG\_ET\_AL\_CATALOG)  
 **keyword:** default is set to NONE (example choices: swpc\_annex)  
   
**Example:**  
 <https://api.nasa.gov/DONKI/CMEAnalysis?startDate=2016-09-01&endDate=2016-09-30&mostAccurateOnly=true&speed=500&halfAngle=30&catalog=ALL&api_key=DEMO_KEY>

## Geomagnetic Storm (GST)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/GST?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/GST?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY)

## Interplanetary Shock (IPS)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
 **location:** default to ALL (choices: Earth, MESSENGER, STEREO A, STEREO B)  
 **catalog:** default to ALL (choices: SWRC\_CATALOG, WINSLOW\_MESSENGER\_ICME\_CATALOG)  
   
**Example:**  
  [https://api.nasa.gov/DONKI/IPS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&location=LOCATION&catalog=CATALOG&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/IPS?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY)

## Solar Flare (FLR)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/FLR?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/FLR?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY)

## Solar Energetic Particle (SEP)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/SEP?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/SEP?startDate=2016-01-01&endDate=2016-01-30&api_key=DEMO_KEY)

## Magnetopause Crossing (MPC)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/MPC?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/MPC?startDate=2016-01-01&endDate=2016-03-31&api_key=DEMO_KEY)

## Radiation Belt Enhancement (RBE)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/RBE?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/RBE?startDate=2016-01-01&endDate=2016-01-31&api_key=DEMO_KEY)

## Hight Speed Stream (HSS)

**startDate:** default to 30 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/HSS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/HSS?startDate=2016-01-01&endDate=2016-01-31&api_key=DEMO_KEY)

## WSA+EnlilSimulation

**startDate:** default to 7 days prior to current UTC date  
 **endDate:** default to current UTC date  
   
**Example:**  
  [https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2011-09-19&endDate=2011-09-20&api\_key=DEMO\_KEY](https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2016-01-06&endDate=2016-01-06&api_key=DEMO_KEY)

## Notifications

**parameters:**  
 'startDate' and 'endDate' are in format 'yyyy-MM-dd' UT  
 'type' could be: all, FLR, SEP, CME, IPS, MPC, GST, RBE, report  
   
**Note:**  
 'startDate' if left out would default to 7 days prior to the current UT date  
 'endDate' if left out would default to current UT date  
 'type' if left out would default to 'all'  
 The request date range is limit to 30 days. If the request range is greater than 30 days, it would limit your request range to (endDate-30) to endDate.  
   
**Example:**  
 <https://api.nasa.gov/DONKI/notifications?startDate=2014-05-01&endDate=2014-05-08&type=all&api_key=DEMO_KEY>
