define([
    'jquery',
    'underscore',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils'
], function($, _, SplunkVisualizationBase, vizUtils) {
    
    return SplunkVisualizationBase.extend({
        
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            
            // Map instance
            this.map = null;
            
            // Layer groups for different data types
            this.layerGroups = {};
            
            // Layer configurations with default colors
            this.layerConfigs = {
                'highway': { color: '#FF6B6B', label: 'Highways', icon: 'road' },
                'rest_area': { color: '#4ECDC4', label: 'Rest Areas', icon: 'parking' },
                'welcome_center': { color: '#45B7D1', label: 'Welcome Centers', icon: 'info' },
                'weigh_station': { color: '#FFA07A', label: 'Weigh Stations', icon: 'scale' },
                'truck_stop': { color: '#98D8C8', label: 'Truck Stops', icon: 'truck' },
                'travel_plaza': { color: '#F7DC6F', label: 'Travel Plazas', icon: 'building' },
                'sex_offender': { color: '#E74C3C', label: 'Sex Offender Addresses', icon: 'warning' },
                'school': { color: '#3498DB', label: 'School Addresses', icon: 'school' },
                'state_boundary': { color: '#9B59B6', label: 'State Boundaries', icon: 'boundary' }
            };
            
            // Track layer visibility and counts
            this.layerVisibility = {};
            this.layerCounts = {};
            
            // Initialize layer visibility
            Object.keys(this.layerConfigs).forEach(key => {
                this.layerVisibility[key] = true;
                this.layerCounts[key] = 0;
            });
        },
        
        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },
        
        formatData: function(data, config) {
            // Check if we have data
            if (!data || !data.fields || !data.rows || data.rows.length === 0) {
                return { error: 'No data available' };
            }
            
            // Get field indices
            const fields = data.fields.map(f => f.name);
            const latIndex = this._findFieldIndex(fields, ['latitude', 'lat', 'Latitude']);
            const lonIndex = this._findFieldIndex(fields, ['longitude', 'lon', 'lng', 'Longitude']);
            const descIndex = this._findFieldIndex(fields, ['description', 'desc', 'Description']);
            const categoryIndex = this._findFieldIndex(fields, ['category', 'type', 'Category', 'Type']);
            
            if (latIndex === -1 || lonIndex === -1) {
                return { error: 'Required fields not found. Please include latitude and longitude fields.' };
            }
            
            // Process rows into layer groups
            const processedData = {};
            
            data.rows.forEach(row => {
                const lat = parseFloat(row[latIndex]);
                const lon = parseFloat(row[lonIndex]);
                
                // Skip invalid coordinates
                if (isNaN(lat) || isNaN(lon)) {
                    return;
                }
                
                // Get category/type (default to 'other' if not specified)
                let category = categoryIndex !== -1 ? row[categoryIndex] : 'other';
                category = this._normalizeCategory(category);
                
                // Get description
                const description = descIndex !== -1 ? row[descIndex] : 'No description';
                
                // Create point data with all fields
                const pointData = {
                    lat: lat,
                    lon: lon,
                    description: description,
                    category: category,
                    fields: {}
                };
                
                // Add all other fields as additional data
                fields.forEach((field, index) => {
                    if (index !== latIndex && index !== lonIndex && index !== descIndex && index !== categoryIndex) {
                        pointData.fields[field] = row[index];
                    }
                });
                
                // Group by category
                if (!processedData[category]) {
                    processedData[category] = [];
                }
                processedData[category].push(pointData);
            });
            
            return processedData;
        },
        
        _findFieldIndex: function(fields, possibleNames) {
            for (let i = 0; i < possibleNames.length; i++) {
                const index = fields.findIndex(f => 
                    f.toLowerCase() === possibleNames[i].toLowerCase()
                );
                if (index !== -1) {
                    return index;
                }
            }
            return -1;
        },
        
        _normalizeCategory: function(category) {
            if (!category) return 'other';
            
            const normalized = category.toLowerCase().replace(/[_\s-]+/g, '_');
            
            // Map common variations to standard categories
            const categoryMap = {
                'highway': 'highway',
                'highways': 'highway',
                'road': 'highway',
                'rest_area': 'rest_area',
                'rest_areas': 'rest_area',
                'rest_stop': 'rest_area',
                'welcome_center': 'welcome_center',
                'welcome_centers': 'welcome_center',
                'welcome': 'welcome_center',
                'weigh_station': 'weigh_station',
                'weigh_stations': 'weigh_station',
                'weigh': 'weigh_station',
                'truck_stop': 'truck_stop',
                'truck_stops': 'truck_stop',
                'truckstop': 'truck_stop',
                'travel_plaza': 'travel_plaza',
                'travel_plazas': 'travel_plaza',
                'plaza': 'travel_plaza',
                'sex_offender': 'sex_offender',
                'sex_offenders': 'sex_offender',
                'offender': 'sex_offender',
                'school': 'school',
                'schools': 'school',
                'state_boundary': 'state_boundary',
                'state_boundaries': 'state_boundary',
                'boundary': 'state_boundary',
                'state': 'state_boundary'
            };
            
            return categoryMap[normalized] || normalized;
        },
        
        updateView: function(data, config) {
            // Clear any existing error messages
            this.$el.find('.error-message').remove();
            
            // Format the data
            const formattedData = this.formatData(data, config);
            
            // Check for errors
            if (formattedData.error) {
                this._showError(formattedData.error);
                return;
            }
            
            // Initialize map if not already created
            if (!this.map) {
                this._initializeMap();
            }
            
            // Clear existing layers
            this._clearLayers();
            
            // Add data to map
            this._addDataToMap(formattedData);
            
            // Update layer controls
            this._updateLayerControls();
        },
        
        _initializeMap: function() {
            const mapContainer = this.$el.find('#leaflet-map');
            
            if (mapContainer.length === 0) {
                this._showError('Map container not found');
                return;
            }
            
            // Create map centered on the United States
            this.map = L.map(mapContainer[0], {
                center: [39.8283, -98.5795], // Geographic center of the US
                zoom: 5,
                zoomControl: true,
                scrollWheelZoom: true
            });
            
            // Add OpenStreetMap tile layer
            L.tileLayer('https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tissot_mercator.png/400px-Tissot_mercator.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                minZoom: 3
            }).addTo(this.map);
            
            // Setup layer controls
            this._setupLayerControls();
            
            // Force map to recalculate size
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        },
        
        _clearLayers: function() {
            // Remove all existing layer groups
            Object.keys(this.layerGroups).forEach(category => {
                if (this.layerGroups[category]) {
                    this.map.removeLayer(this.layerGroups[category]);
                }
            });
            
            // Reset layer groups
            this.layerGroups = {};
            
            // Reset counts
            Object.keys(this.layerCounts).forEach(key => {
                this.layerCounts[key] = 0;
            });
        },
        
        _addDataToMap: function(data) {
            // Create layer groups and add markers for each category
            Object.keys(data).forEach(category => {
                const points = data[category];
                
                if (!points || points.length === 0) {
                    return;
                }
                
                // Create a layer group for this category
                const layerGroup = L.layerGroup();
                
                // Get color for this category
                const color = this.layerConfigs[category]?.color || '#808080';
                
                // Add markers to the layer group
                points.forEach(point => {
                    const marker = this._createMarker(point, color);
                    marker.addTo(layerGroup);
                });
                
                // Store layer group
                this.layerGroups[category] = layerGroup;
                
                // Update count
                this.layerCounts[category] = points.length;
                
                // Add to map if visible
                if (this.layerVisibility[category] !== false) {
                    layerGroup.addTo(this.map);
                }
            });
        },
        
        _createMarker: function(point, color) {
            // Create custom icon with color
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
                          fill="${color}" stroke="#fff" stroke-width="2"/>
                    <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
                </svg>`,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [0, -41]
            });
            
            // Create marker
            const marker = L.marker([point.lat, point.lon], { icon: icon });
            
            // Create popup content
            let popupContent = `<h4>${point.description}</h4>`;
            popupContent += `<p><strong>Category:</strong> ${point.category}</p>`;
            popupContent += `<p><strong>Coordinates:</strong> ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}</p>`;
            
            // Add additional fields
            if (point.fields && Object.keys(point.fields).length > 0) {
                Object.keys(point.fields).forEach(field => {
                    popupContent += `<p><strong>${field}:</strong> ${point.fields[field]}</p>`;
                });
            }
            
            marker.bindPopup(popupContent);
            
            return marker;
        },
        
        _setupLayerControls: function() {
            const controlsContainer = this.$el.find('#layer-controls');
            const toggleBtn = this.$el.find('#toggle-controls');
            const controlsContent = this.$el.find('#controls-content');
            
            // Setup toggle functionality
            toggleBtn.on('click', () => {
                controlsContent.toggleClass('collapsed');
                toggleBtn.toggleClass('collapsed');
            });
            
            // Setup header click to toggle
            this.$el.find('.controls-header').on('click', (e) => {
                if ($(e.target).closest('.toggle-btn').length === 0) {
                    controlsContent.toggleClass('collapsed');
                    toggleBtn.toggleClass('collapsed');
                }
            });
        },
        
        _updateLayerControls: function() {
            const controlsContent = this.$el.find('#controls-content');
            controlsContent.empty();
            
            // Add controls for each layer
            Object.keys(this.layerConfigs).forEach(category => {
                const config = this.layerConfigs[category];
                const count = this.layerCounts[category] || 0;
                
                // Only show if there's data for this category
                if (count === 0) {
                    return;
                }
                
                const controlItem = $(`
                    <div class="layer-control-item" data-category="${category}">
                        <label>
                            <input type="checkbox" 
                                   class="layer-toggle" 
                                   data-category="${category}"
                                   ${this.layerVisibility[category] !== false ? 'checked' : ''}>
                            <div class="layer-info">
                                <span class="layer-name">${config.label}</span>
                                <span class="layer-count">${count} item${count !== 1 ? 's' : ''}</span>
                            </div>
                        </label>
                        <input type="color" 
                               class="layer-color" 
                               data-category="${category}"
                               value="${config.color}">
                    </div>
                `);
                
                controlsContent.append(controlItem);
            });
            
            // Bind event handlers
            this._bindLayerControlEvents();
        },
        
        _bindLayerControlEvents: function() {
            // Handle layer toggle
            this.$el.find('.layer-toggle').off('change').on('change', (e) => {
                const category = $(e.target).data('category');
                const isVisible = $(e.target).is(':checked');
                
                this.layerVisibility[category] = isVisible;
                
                if (this.layerGroups[category]) {
                    if (isVisible) {
                        this.layerGroups[category].addTo(this.map);
                    } else {
                        this.map.removeLayer(this.layerGroups[category]);
                    }
                }
            });
            
            // Handle color change
            this.$el.find('.layer-color').off('change').on('change', (e) => {
                const category = $(e.target).data('category');
                const newColor = $(e.target).val();
                
                // Update config
                this.layerConfigs[category].color = newColor;
                
                // Recreate markers with new color
                this._updateLayerColor(category, newColor);
            });
        },
        
        _updateLayerColor: function(category, color) {
            if (!this.layerGroups[category]) {
                return;
            }
            
            const layerGroup = this.layerGroups[category];
            const wasVisible = this.layerVisibility[category];
            
            // Get all markers in the layer
            const markers = [];
            layerGroup.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    const latLng = layer.getLatLng();
                    const popup = layer.getPopup();
                    markers.push({
                        lat: latLng.lat,
                        lon: latLng.lng,
                        popup: popup ? popup.getContent() : ''
                    });
                }
            });
            
            // Clear the layer group
            layerGroup.clearLayers();
            
            // Recreate markers with new color
            markers.forEach(markerData => {
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
                              fill="${color}" stroke="#fff" stroke-width="2"/>
                        <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
                    </svg>`,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [0, -41]
                });
                
                const marker = L.marker([markerData.lat, markerData.lon], { icon: icon });
                
                if (markerData.popup) {
                    marker.bindPopup(markerData.popup);
                }
                
                marker.addTo(layerGroup);
            });
            
            // Re-add to map if it was visible
            if (wasVisible && !this.map.hasLayer(layerGroup)) {
                layerGroup.addTo(this.map);
            }
        },
        
        _showError: function(message) {
            const errorDiv = $(`
                <div class="error-message">
                    <strong>Error:</strong> ${message}
                </div>
            `);
            this.$el.append(errorDiv);
        },
        
        reflow: function() {
            if (this.map) {
                this.map.invalidateSize();
            }
        }
    });
});
