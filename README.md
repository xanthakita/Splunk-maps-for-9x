# Splunk Leaflet Maps Visualization Plugin

A custom visualization plugin for Splunk 9.4.x that provides interactive mapping capabilities using Leaflet.js. This plugin allows you to visualize geospatial data from your Splunk searches with support for multiple layers, custom colors, and various marker types.

## Features

- 🗺️ **Interactive Leaflet.js Map** - Smooth, responsive mapping experience
- 🎨 **Customizable Layer Colors** - Choose colors for each data layer
- 📊 **Multiple Data Layers** - Support for various categories with independent visibility controls
- 📍 **Custom Markers** - Different marker styles for different data types
- 🇺🇸 **US-Centered View** - Starts with a view of the entire United States
- 💾 **Large Dataset Support** - Handles up to 10,000 data points
- 🎯 **Smart Category Detection** - Automatically categorizes data based on type field

## Supported Data Categories

The visualization supports the following predefined categories with optimized styling:

- **Highways** - Road and highway data
- **Rest Areas** - Rest stop locations
- **Welcome Centers** - Tourist welcome center locations
- **Weigh Stations** - Commercial vehicle weigh stations
- **Truck Stops** - Truck stop locations
- **Travel Plazas** - Travel plaza and service area locations
- **Sex Offender Addresses** - Registered sex offender locations
- **School Addresses** - School and educational facility locations
- **State Boundaries** - State border and boundary markers

## Requirements

- **Splunk Version**: 9.4.x or higher
- **Internet Connection**: Required for loading Leaflet.js library and map tiles
- **Data Format**: CSV or any indexed data with latitude and longitude fields

## Installation

### Method 1: Manual Installation

1. **Download the Plugin**
   ```bash
   git clone https://github.com/xanthakita/Splunk-maps-for-9x.git
   ```

2. **Copy to Splunk Apps Directory**
   
   Copy the entire `Splunk-maps-for-9x` folder to your Splunk apps directory:
   
   - **Linux/Mac**: `$SPLUNK_HOME/etc/apps/`
   - **Windows**: `%SPLUNK_HOME%\etc\apps\`
   
   ```bash
   # Example for Linux/Mac
   cp -r Splunk-maps-for-9x $SPLUNK_HOME/etc/apps/
   
   # Set proper permissions
   chown -R splunk:splunk $SPLUNK_HOME/etc/apps/Splunk-maps-for-9x
   ```

3. **Restart Splunk**
   ```bash
   $SPLUNK_HOME/bin/splunk restart
   ```

4. **Verify Installation**
   - Log in to Splunk Web (http://localhost:8000 by default)
   - Navigate to Settings > Data Visualizations
   - Look for "Leaflet Map" in the list of available visualizations

### Method 2: Splunk Web UI Installation (Coming Soon)

Package the app as a `.spl` or `.tar.gz` file and install via the Splunk Web UI.

## Data Requirements

### Required Fields

Your Splunk search must return data with the following fields:

| Field Name | Type | Description | Variations Accepted |
|------------|------|-------------|---------------------|
| **latitude** | Float | Latitude coordinate | `latitude`, `lat`, `Latitude` |
| **longitude** | Float | Longitude coordinate | `longitude`, `lon`, `lng`, `Longitude` |

### Optional Fields

| Field Name | Type | Description | Default |
|------------|------|-------------|---------|
| **description** | String | Marker description/label | "No description" |
| **category** | String | Data type/category | "other" |

### Additional Fields

Any additional fields in your search results will be included in the marker popup information.

## Usage Examples

### Example 1: Basic Highway Markers

```spl
| inputlookup highways.csv
| table description, latitude, longitude, category
```

**Expected CSV Format:**
```csv
description,latitude,longitude,category
I-40 Exit 125,35.2456,-92.3456,highway
I-30 Exit 98,34.7456,-92.1234,highway
```

### Example 2: Multiple Categories

```spl
| inputlookup arkansas_locations.csv
| search category IN ("rest_area", "welcome_center", "weigh_station")
| table description, latitude, longitude, category, address, city
```

**Expected Data:**
```csv
description,latitude,longitude,category,address,city
Arkansas Welcome Center North,36.4989,-94.1574,welcome_center,123 Main St,Bentonville
Rest Area Mile 45,35.1234,-92.4567,rest_area,I-40 Mile 45,Little Rock
Weigh Station I-40 East,34.9876,-91.2345,weigh_station,I-40 MM 120,Forrest City
```

### Example 3: Complex Multi-Layer Visualization

```spl
| inputlookup all_locations.csv
| eval category=case(
    type=="highway", "highway",
    type=="rest", "rest_area",
    type=="school", "school",
    type=="offender", "sex_offender",
    1=1, "other"
)
| table description, latitude, longitude, category, name, address, city, state
```

### Example 4: Search-Time Field Extraction

```spl
index=locations sourcetype=csv
| rex field=_raw "(?<latitude>[\d.-]+),(?<longitude>[\d.-]+),(?<description>[^,]+),(?<category>\w+)"
| table description, latitude, longitude, category
```

### Example 5: Arkansas State Boundaries and Locations

```spl
(index=boundaries sourcetype=state_borders state="Arkansas")
OR (index=locations sourcetype=facilities state="Arkansas")
| eval category=case(
    sourcetype=="state_borders", "state_boundary",
    facility_type=="truck_stop", "truck_stop",
    facility_type=="travel_plaza", "travel_plaza",
    1=1, "other"
)
| table description, latitude, longitude, category
```

## Configuration Options

### Layer Colors

Once your visualization is displayed, you can customize the color of each layer:

1. Click on the **Layer Controls** panel (top-right corner of the map)
2. Find the layer you want to customize
3. Click on the color picker next to the layer name
4. Select your desired color
5. The markers will update immediately

### Default Layer Colors

| Category | Default Color | Hex Code |
|----------|---------------|----------|
| Highways | Red | #FF6B6B |
| Rest Areas | Turquoise | #4ECDC4 |
| Welcome Centers | Sky Blue | #45B7D1 |
| Weigh Stations | Light Salmon | #FFA07A |
| Truck Stops | Mint Green | #98D8C8 |
| Travel Plazas | Yellow | #F7DC6F |
| Sex Offender Addresses | Red | #E74C3C |
| School Addresses | Blue | #3498DB |
| State Boundaries | Purple | #9B59B6 |

### Layer Visibility

Toggle layers on/off by:

1. Opening the **Layer Controls** panel
2. Checking/unchecking the checkbox next to each layer
3. The map updates in real-time

## Creating Sample Data

### Sample CSV File: highways.csv

```csv
description,latitude,longitude,category,highway,direction
I-40 Exit 7,35.0039,-94.4269,highway,I-40,Westbound
I-40 Exit 12,35.0297,-94.3687,highway,I-40,Eastbound
I-30 Exit 98,34.4628,-93.0541,highway,I-30,Eastbound
US-67 Junction,35.2420,-91.7337,highway,US-67,Northbound
```

### Uploading Sample Data to Splunk

1. **Via Splunk Web UI:**
   - Go to Settings > Add Data
   - Click "Upload"
   - Select your CSV file
   - Set Source Type to "csv"
   - Set index (e.g., "main" or create "locations")
   - Save as lookup table (optional but recommended)

2. **Via Command Line:**
   ```bash
   # Copy CSV to lookup directory
   cp highways.csv $SPLUNK_HOME/etc/apps/search/lookups/
   
   # Define lookup in transforms.conf
   # Add to $SPLUNK_HOME/etc/apps/search/local/transforms.conf
   [highways]
   filename = highways.csv
   ```

## Troubleshooting

### Issue: "No data available" error

**Causes:**
- Search returned no results
- Required fields (latitude/longitude) are missing
- Field names don't match expected variations

**Solutions:**
1. Verify your search returns data: Add `| table *` to see all fields
2. Check field names: Use `| fields + latitude, longitude` or acceptable variations
3. Ensure data types are correct: `| eval latitude=tonumber(latitude), longitude=tonumber(longitude)`

### Issue: "Required fields not found" error

**Cause:** The visualization cannot find latitude and longitude fields

**Solution:**
Rename your fields to match expected names:
```spl
| rename lat AS latitude, long AS longitude
| table description, latitude, longitude, category
```

### Issue: Markers not appearing

**Causes:**
- Invalid coordinates (NaN, null, or out of range)
- Layer is toggled off

**Solutions:**
1. Filter invalid coordinates:
   ```spl
   | where isnotnull(latitude) AND isnotnull(longitude)
   | where latitude >= -90 AND latitude <= 90
   | where longitude >= -180 AND longitude <= 180
   ```
2. Check layer visibility in the Layer Controls panel

### Issue: Map not displaying correctly

**Causes:**
- Internet connection required for Leaflet.js and map tiles
- Browser compatibility issues

**Solutions:**
1. Check internet connectivity
2. Clear browser cache and reload
3. Try a different browser (Chrome, Firefox, Edge recommended)
4. Check browser console for errors (F12)

### Issue: Map is blank or shows incorrect area

**Cause:** The map might need to be resized or refreshed

**Solution:**
- Click the visualization refresh button in Splunk
- Resize the browser window
- The map will automatically adjust

## Advanced Usage

### Custom Category Mapping

If your data uses different category names, the plugin will attempt to normalize them. The following variations are automatically recognized:

| Your Category | Normalized To |
|---------------|---------------|
| highways, road | highway |
| rest_stop, rest_areas | rest_area |
| welcome, welcome_centers | welcome_center |
| weigh, weigh_stations | weigh_station |
| truckstop, truck_stops | truck_stop |
| plaza, travel_plazas | travel_plaza |
| offender, sex_offenders | sex_offender |
| schools | school |
| boundary, state, state_boundaries | state_boundary |

### Performance Optimization

For large datasets:

1. **Filter at search time:**
   ```spl
   | search state="Arkansas" 
   | head 5000
   ```

2. **Use summary indexing for frequently accessed data**

3. **Aggregate nearby points:**
   ```spl
   | eval lat_rounded=round(latitude, 2), lon_rounded=round(longitude, 2)
   | stats count by lat_rounded, lon_rounded, category
   | eval latitude=lat_rounded, longitude=lon_rounded
   | eval description="Clustered: " + count + " locations"
   ```

## Developer Information

### Directory Structure

```
Splunk-maps-for-9x/
├── appserver/
│   └── static/
│       └── visualizations/
│           └── leaflet_map/
│               ├── visualization.js       # Main visualization logic
│               ├── visualization.css      # Styling
│               └── formatter.html         # HTML template
├── default/
│   ├── app.conf                          # App configuration
│   └── visualizations.conf               # Visualization settings
├── metadata/
│   └── default.meta                      # Permissions
└── README.md                             # This file
```

### Customizing the Plugin

#### Modify Default Map Center

Edit `visualization.js`, line ~153:

```javascript
this.map = L.map(mapContainer[0], {
    center: [39.8283, -98.5795], // Change these coordinates
    zoom: 5,                      // Change zoom level
    zoomControl: true,
    scrollWheelZoom: true
});
```

#### Add New Layer Categories

Edit `visualization.js`, line ~14:

```javascript
this.layerConfigs = {
    'your_category': { 
        color: '#YOUR_HEX_COLOR', 
        label: 'Your Display Name', 
        icon: 'icon_name' 
    },
    // ... existing categories
};
```

#### Change Map Tile Provider

Edit `visualization.js`, line ~165:

```javascript
L.tileLayer('https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tissot_mercator.png/400px-Tissot_mercator.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(this.map);
```

Alternative providers:
- **CartoDB Positron**: `https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhho8g0FVgtxjkjUi6yjiTw78xg3kQMl97p4MGr9jGXAO6JOhyphenhyphenlOE5qvrnW07-WmAp1Zc2vO7Lys-XfzJR_BW1GRbzXog-mBqv7EG865a2BTnnGaOod_nphtOK3VYHjBPH5OHSCvQ/s523/mapsmania2.gif`
- **CartoDB Dark**: `https://i.ytimg.com/vi/vUDcMY-srmk/sddefault.jpg`
- **Stamen Terrain**: `https://developers.google.com/static/maps/documentation/tile/images/terrain_tiles_example.png`

## Support & Contribution

### Reporting Issues

If you encounter any issues or have feature requests:

1. Check the Troubleshooting section above
2. Open an issue on GitHub: https://github.com/xanthakita/Splunk-maps-for-9x/issues
3. Provide:
   - Splunk version
   - Error messages
   - Sample SPL query
   - Browser and version

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Leaflet.js](https://leafletjs.com/) - BSD-2-Clause License
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) - ODbL License
- Designed for Splunk 9.4.x

## Version History

### Version 1.0.0 (Current)
- Initial release
- Support for multiple data layers
- Customizable layer colors
- Interactive map controls
- US-centered default view
- Support for 9 predefined categories
- Handles up to 10,000 data points

## Contact

- **GitHub**: https://github.com/xanthakita/Splunk-maps-for-9x
- **Author**: xanthakita

---

**Note**: This visualization requires an internet connection to load the Leaflet.js library and map tiles from external sources.
