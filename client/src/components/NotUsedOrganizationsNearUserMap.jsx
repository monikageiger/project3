import { useEffect } from "react";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
mapboxgl.accessToken = "pk.eyJ1IjoiaHJpYnUiLCJhIjoiY2t1Nmsycm5tMmg3MTJucGNoamJxODBrMCJ9.aT4XOnLfqTr3V4EowsmtSg";

export default function OrganizationsNearUserMap(props) {
    const {orgs} = props;

    useEffect(() => {

        const map = new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/streets-v11", // change style
          center: [-35, 30],
          zoom: 1,
        });
    
        map.on("load", () => {
          // Add a new source from our GeoJSON data and
          // set the 'cluster' option to true. GL-JS will
          // add the point_count property to your source data.
    
          // orgs data has to be passed as a features property inside an object
          const orgsString = { features: orgs };
    
          map.addSource("organizations", {
            type: "geojson",
            data: orgsString,
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
          });
    
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "organizations",
            filter: ["has", "point_count"],
            paint: {
              // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
              // with three steps to implement three types of circles:
              //   * Blue, 20px circles when point count is less than 100
              //   * Yellow, 30px circles when point count is between 100 and 750
              //   * Pink, 40px circles when point count is greater than or equal to 750
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#E27BF5",
                100,
                "#E27BF5",
                750,
                "#E27BF5",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
              ],
            },
          });
    
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "organizations",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
          });
    
          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "organizations",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": "#E27BF5",
              "circle-radius": 15,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#E27BF5",
            },
          });
    
          // inspect a cluster on click
          map.on("click", "clusters", (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            const clusterId = features[0].properties.cluster_id;
            map
              .getSource("organizations")
              .getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
    
                map.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom,
                });
              });
          });
    
          // When a click event occurs on a feature in
          // the unclustered-point layer, open a popup at
          // the location of the feature, with
          // description HTML from its properties.
          map.on("click", "unclustered-point", (e) => {
            const popUpMarkup = e.features[0].properties.popUpMarkup;
            const coordinates = e.features[0].geometry.coordinates.slice();
    
            // Ensure that if the map is zoomed out such that
            // multiple copies of the feature are visible, the
            // popup appears over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            
            map.easeTo({
              center: e.features[0].geometry.coordinates.slice(),
              zoom: 12,
            });
    
            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(popUpMarkup)
              .addTo(map);
    
          });
    
          // Once the organizations (map features) are loaded, zoom to fit all orgs
          const featuresLoaded = map.getSource('organizations')._options.data.features;
          if(featuresLoaded.length !== 0) {
            const bounds = new mapboxgl.LngLatBounds();
            const mySource = map.getSource('organizations');
            mySource._options.data.features.forEach((feature) => {
              bounds.extend(feature.geometry.coordinates);
            });
            map.fitBounds(bounds, {padding : 30});
          }
    
          //
          map.on("mouseenter", "clusters", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "clusters", () => {
            map.getCanvas().style.cursor = "";
          });
    
        });
    
      },[orgs]);
    

    return (
        <div id="map" style={{ width: "100%", height: "500px" }}></div>
    )
}