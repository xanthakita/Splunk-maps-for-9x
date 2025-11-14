# Testing Guide for Splunk Leaflet Maps Visualization

## What Was Fixed

### 1. **Comprehensive Console Logging**
   - Added detailed logging throughout the data processing pipeline
   - Logs show exactly what data Splunk is sending to the visualization
   - Tracks data transformation at each step
   - Identifies where data issues occur

### 2. **Enhanced Data Parsing**
   - Expanded field name detection to handle more variations:
     - Latitude: `latitude`, `lat`, `Latitude`, `_geo_lat`
     - Longitude: `longitude`, `lon`, `lng`, `Longitude`, `_geo_lon`
     - Description: `description`, `desc`, `Description`, `name`, `Name`
     - Category/Layer: `category`, `type`, `Category`, `Type`, `layer`, `Layer`
     - Color: `color`, `Color`, `colour`, `Colour`
   
### 3. **Better Error Messages**
   - Specific error messages that tell you exactly what's wrong
   - Lists available fields when required fields are missing
   - Counts valid vs invalid data points
   - Shows which categories were found and how many points each has

### 4. **Custom Color Support**
   - Can now specify custom colors per point via a `color` field
   - Falls back to category defaults if no custom color provided

### 5. **Fixed Map Tile Layer**
   - Corrected OpenStreetMap tile server URL for proper map display

## How to Test

### Step 1: Restart Splunk
After the code changes, you need to restart Splunk to pick up the new JavaScript:

```bash
$SPLUNK_HOME/bin/splunk restart
```

Or if you're using bumping browser cache:
- Hard refresh your browser (Ctrl+Shift+R on Chrome/Firefox)
- Or clear browser cache

### Step 2: Open Browser Developer Console
Before running any searches, open your browser's developer console:
- **Chrome/Edge**: Press F12 or Ctrl+Shift+I
- **Firefox**: Press F12 or Ctrl+Shift+K
- **Safari**: Press Cmd+Option+I

Keep the console open to see all the debug logs.

### Step 3: Run Test Searches

#### Test 1: Basic Inline Data (Original Example)
```spl
| makeresults 
| eval latitude=40.7128, longitude=-74.0060, description="New York City", layer="city" 
| append [| makeresults | eval latitude=34.0522, longitude=-118.2437, description="Los Angeles", layer="city"]
| append [| makeresults | eval latitude=41.8781, longitude=-87.6298, description="Chicago", layer="city"]
| table latitude longitude description layer
```

#### Test 2: With Custom Colors
```spl
| makeresults 
| eval latitude=40.7128, longitude=-74.0060, description="New York City", layer="city", color="#FF0000"
| append [| makeresults | eval latitude=34.0522, longitude=-118.2437, description="Los Angeles", layer="city", color="#00FF00"]
| append [| makeresults | eval latitude=41.8781, longitude=-87.6298, description="Chicago", layer="city", color="#0000FF"]
| table latitude longitude description layer color
```

#### Test 3: Different Field Names
```spl
| makeresults 
| eval lat=40.7128, lon=-74.0060, name="New York City", type="city" 
| append [| makeresults | eval lat=34.0522, lon=-118.2437, name="Los Angeles", type="city"]
| table lat lon name type
```

#### Test 4: Multiple Categories
```spl
| makeresults 
| eval latitude=40.7128, longitude=-74.0060, description="Central Park", category="park"
| append [| makeresults | eval latitude=40.7589, longitude=-73.9851, description="Times Square", category="landmark"]
| append [| makeresults | eval latitude=40.6892, longitude=-74.0445, description="Statue of Liberty", category="landmark"]
| append [| makeresults | eval latitude=40.7614, longitude=-73.9776, description="Bryant Park", category="park"]
| table latitude longitude description category
```

### Step 4: Check the Console Logs

Look for these log entries in the console:

1. **updateView called** - Shows the raw data received from Splunk
2. **formatData called** - Shows how data is being processed
3. **Field names** - Lists all available fields
4. **Field indices found** - Shows which fields were matched
5. **Sample rows** - Shows the first few data rows
6. **Processing summary** - Shows valid/invalid row counts and categories found
7. **Map initialization** - Shows if the map was created successfully
8. **Data added to map** - Shows markers being added

### Step 5: Interpret the Logs

#### If you see "No data available":
Check the console for these specific errors:
- **"data is null or undefined"** - Splunk isn't sending any data
- **"fields are missing"** - Data structure is wrong
- **"no rows returned from search"** - Your search returned no results
- **"Required fields not found"** - Missing latitude or longitude fields
  - The error will list available fields
- **"All rows had invalid coordinates"** - Coordinates couldn't be parsed as numbers

#### Success indicators:
- ✅ "formatData completed successfully"
- ✅ "Valid rows: X" (where X > 0)
- ✅ "Categories found: [...]" with your categories listed
- ✅ "Layer 'X' added to map (visible)"
- ✅ You see markers on the map

## Common Issues and Solutions

### Issue 1: "Map container not found"
**Cause**: The HTML template isn't loaded or the container ID is wrong
**Solution**: Check that the `leaflet_map.html` file exists and has `<div id="leaflet-map"></div>`

### Issue 2: "Required fields not found"
**Cause**: Your data doesn't have latitude/longitude fields
**Solution**: 
- Check the console log for "Available fields: ..."
- Make sure your search includes fields that match one of these:
  - Latitude: `latitude`, `lat`, `Latitude`, `_geo_lat`
  - Longitude: `longitude`, `lon`, `lng`, `Longitude`, `_geo_lon`

### Issue 3: "All rows had invalid coordinates"
**Cause**: Coordinates are not valid numbers
**Solution**:
- Check the console for sample rows to see what values are in lat/lon fields
- Make sure coordinates are numbers, not strings or other data types
- Valid range: Latitude -90 to 90, Longitude -180 to 180

### Issue 4: Map loads but no markers appear
**Cause**: 
- Data is being filtered out due to invalid coordinates
- Categories are hidden in the layer controls
**Solution**:
- Check the console for "Valid rows: X" - should be > 0
- Check the layer controls on the left side of the map
- Make sure category checkboxes are checked

### Issue 5: Markers appear in wrong location
**Cause**: Latitude and longitude are swapped
**Solution**: 
- Check the console logs for sample rows
- Latitude should be between -90 and 90
- Longitude should be between -180 and 180
- If values are outside these ranges, your fields might be swapped

## Advanced Debugging

### Enable More Detailed Logging
The visualization now logs:
- Complete data object structure
- All field names and their indices
- First 3 rows in detail with coordinate parsing
- Processing summary with category counts
- Layer creation and visibility status

### Check Data Format
In the console, look for the "Data object:" log. It should show:
```javascript
{
  fields: [
    {name: "latitude", ...},
    {name: "longitude", ...},
    {name: "description", ...}
  ],
  rows: [
    [40.7128, -74.0060, "New York City"],
    [34.0522, -118.2437, "Los Angeles"],
    ...
  ]
}
```

### Verify Splunk Output Mode
The visualization requests `ROW_MAJOR_OUTPUT_MODE` which means:
- `data.fields` is an array of field objects
- `data.rows` is an array of arrays (each inner array is a row)
- Values are accessed by index: `row[fieldIndex]`

## Support

If you're still having issues:
1. Copy the complete console log output
2. Note which test search you were running
3. Include any error messages from Splunk itself
4. Check if the visualization loads at all or shows any error in the UI

The comprehensive logging should help identify exactly where the data flow is breaking.
