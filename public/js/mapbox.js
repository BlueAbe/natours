/* eslint-disable */
import mapboxgl from 'mapbox-gl';
export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmx1ZWFiZSIsImEiOiJja24wbTAzbzgwbjJyMndwY3RxMTFraWhuIn0.uCZmL0ihz04WjwR8CBDGEw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/blueabe/ckn0mriwh1a3817o36upb1hfp',
    scrollZoom: false
    //   center: [-118.066827, 34.037041],
    //   zoom: 10
    //   interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 200,
      right: 200
    }
  });
};
