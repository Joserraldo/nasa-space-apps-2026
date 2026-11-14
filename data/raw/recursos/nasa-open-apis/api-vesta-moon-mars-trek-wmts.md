<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «Vesta/Moon/Mars Trek WMTS») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# Vesta/Moon/Mars Trek WMTS

Here we have the collection of APIs that power the awesome [Mars Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) and [Vesta Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=vesta) NASA web-based portals for exploration and have newly added [Moon Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon). These APIs can be leveraged using your favorite OGC RESTFul Web Map and Tile Service (WMTS) client. Please visit <http://www.opengeospatial.org/standards/wmts> for more information about WMTS. To help you get started, we've included some demos using the ESRI javascript client library for [Mars](https://api.nasa.gov/mars-wmts/catalog/) and [Vesta](https://api.nasa.gov/vesta-wmts/catalog/).

This API is maintained and provided by the NASA [Solar System Exploration Research Virtual Institute (SSERVI)](http://sservi.nasa.gov/) and the [Jet Propulsion Lab (JPL) Trek team](mailto:MarsTrek@jpl.nasa.gov).

### Available Moon Mosaics

Here is basic information about how to request image tiles from a RESTful WMTS service. The basic URL template is as follows:

`http://{WMTS endpoint}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`

\* Some services are .png and some are .jpg. Please look at WMTS GetCapabilities ResourcesURL element to find out what extension to use. In order to fill in the variables in the template URL, you need to parse the WMTS GetCapabilities XML. GetCapabilities XML can be found for each product below. From the WMTS GetCapabilities XML, find ows:Identifier element inside Style element. This value replaces{Style}. The ows:Identifier element inside TileMatrixSet element replaces{TileMatrixSet}. Inside the TileMatrixSet element in WMTS Capabilities, there is a list of TileMatrix. This is the Zoom level. Replace{TileMatrix}with the ows:Identifier found in TileMatrix element.{TileRow}and{TileCol}are row and col index for tiles. The first zoom level for a product that covers the entire globe will have two columns and one row so that the URLs are as follows:

`http://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/0.jpg   
 http://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/1.jpg`

The second zoom level has four columns and two rows and so on. If the image tile is missing, that means there is no data coverage in that area. You can also use coverage Bbox to calculate the coverage before requesting image tiles.

For a complete listing of the Moon's Equirectangular, North Polar and South Polar based Services, please see <https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon>

### Available Mars Mosaics

| Mosaic | Preview | WMTS Capabilities |
| --- | --- | --- |
| Viking Color Mosaic - Global Map | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml) |
| CTX Mosaic - Curiosity Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/curiosity_ctx_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/curiosity_ctx_mosaic/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - Curiosity Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/curiosity_hirise_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/curiosity_hirise_mosaic/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - ESP\_040776\_2115 | [Preview](https://api.nasa.gov/mars-wmts/catalog/ESP_040776_2115_RED_A_01_ORTHO.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/ESP_040776_2115_RED_A_01_ORTHO/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - ESP\_042252\_1930\_RED\_B\_01\_ORTHO | [Preview](https://api.nasa.gov/mars-wmts/catalog/ESP_042252_1930_RED_B_01_ORTHO.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/ESP_042252_1930_RED_B_01_ORTHO/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - ESP\_042647\_1760\_RED\_B\_01\_ORTHO | [Preview](https://api.nasa.gov/mars-wmts/catalog/ESP_042647_1760_RED_B_01_ORTHO.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/ESP_042647_1760_RED_B_01_ORTHO/1.0.0/WMTSCapabilities.xml) |
| HRSC Mosaic - Martian East | [Preview](https://api.nasa.gov/mars-wmts/catalog/HRSC_Martian_east.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/HRSC_Martian_east/1.0.0/WMTSCapabilities.xml) |
| HRSC Color Mosaic - MC11 | [Preview](https://api.nasa.gov/mars-wmts/catalog/MC11E_HRMOSCO_COL.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/MC11E_HRMOSCO_COL/1.0.0/WMTSCapabilities.xml) |
| HRSC Mosaic - MC11 | [Preview](https://api.nasa.gov/mars-wmts/catalog/MC11E_HRMOSND_ND5.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/MC11E_HRMOSND_ND5/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - Spirit Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/spirit_hirise_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/spirit_hirise_mosaic/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - Opportunity Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/opportunity_hirise_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/opportunity_hirise_mosaic/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - Phoenix Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/phoenix_hirise_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/phoenix_hirise_mosaic/1.0.0/WMTSCapabilities.xml) |
| HiRISE Mosaic - Sojourner Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/sojourner_hirise_mosaic.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/sojourner_hirise_mosaic/1.0.0/WMTSCapabilities.xml) |
| Albedo Mosaic - Thermal Emission Spectrometer | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_TES_Albedo_mosaic_global_7410m.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_TES_Albedo_mosaic_global_7410m/1.0.0/WMTSCapabilities.xml) |
| DEM Grayscale - Mars Orbiter Laser Altimeter | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_MOLA_DEM_mosaic_global_463m_8.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_MOLA_DEM_mosaic_global_463m_8/1.0.0/WMTSCapabilities.xml) |
| Color Hillshade - Mars Orbiter Laser Altimeter | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_MOLA_ClrShade_merge_global_463m.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml) |
| Experience Curiosity - Curiosity Landing Site | [Preview](https://api.nasa.gov/mars-wmts/catalog/mars_pahrump_patch_8k_256m.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/mars_pahrump_patch_8k_256m/1.0.0/WMTSCapabilities.xml) |
| Atlas Mosaic - Mars Orbiter Camera | [Preview](https://api.nasa.gov/mars-wmts/catalog/msss_atlas_simp_clon.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/msss_atlas_simp_clon/1.0.0/WMTSCapabilities.xml) |
| Infrared Night - Thermal Emission Imaging System | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_MO_THEMIS-IR-Night_mosaic_60N60S_100m_v14_clon0_ly.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_MO_THEMIS-IR-Night_mosaic_60N60S_100m_v14_clon0_ly/1.0.0/WMTSCapabilities.xml) |
| Infrared Day - Thermal Emission Imaging System | [Preview](https://api.nasa.gov/mars-wmts/catalog/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly/1.0.0/WMTSCapabilities.xml) |
| HRSC Mosaic - Mawrth Vallis | [Preview](https://api.nasa.gov/mars-wmts/catalog/hrsc_mawrth_vallis.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/hrsc_mawrth_vallis/1.0.0/WMTSCapabilities.xml) |
| HRSC Color Mosaic - Mawrth Vallis | [Preview](https://api.nasa.gov/mars-wmts/catalog/hrsc_mawrth_vallis_color.html) | [WMTS Capabilities](https://api.nasa.gov/mars-wmts/catalog/hrsc_mawrth_vallis_color/1.0.0/WMTSCapabilities.xml) |

### Available Vesta Mosaics

| Mosaic | Preview | WMTS Capabilities |
| --- | --- | --- |
| global\_LAMO | [Preview](https://api.nasa.gov/vesta-wmts/catalog/global_LAMO.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/global_LAMO/1.0.0/WMTSCapabilities.xml) |
| Vesta\_Dawn\_HAMO\_DTM\_DLR\_Global\_48ppd 8Bit | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd8.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd8/1.0.0/WMTSCapabilities.xml) |
||  |  |  |
| --- | --- | --- |
| Vesta\_Dawn\_Geology\_Global\_32ppd\_IAU | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_Geology_Global_32ppd_IAU.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_Geology_Global_32ppd_IAU/1.0.0/WMTSCapabilities.xml) |
| Vesta\_Dawn\_HAMO\_ClrShade\_DLR\_Global\_48ppd\_IAU | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_ClrShade_DLR_Global_48ppd_IAU.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_ClrShade_DLR_Global_48ppd_IAU/1.0.0/WMTSCapabilities.xml) |
| Vesta\_Dawn\_HAMO\_MinRatio\_DLR\_global\_74ppd\_IAU | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_MinRatio_DLR_global_74ppd_IAU.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_MinRatio_DLR_global_74ppd_IAU/1.0.0/WMTSCapabilities.xml) |
| Vesta\_Dawn\_HAMO\_Shade\_DLR\_Global\_48ppd\_IAU | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_Shade_DLR_Global_48ppd_IAU.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_Shade_DLR_Global_48ppd_IAU/1.0.0/WMTSCapabilities.xml) |
| Vesta\_Dawn\_HAMO\_TrueClr\_DLR\_global\_74ppd | [Preview](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_TrueClr_DLR_global_74ppd.html) | [WMTS Capabilities](https://api.nasa.gov/vesta-wmts/catalog/Vesta_Dawn_HAMO_TrueClr_DLR_global_74ppd/1.0.0/WMTSCapabilities.xml) |
