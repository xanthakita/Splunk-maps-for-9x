# Push Instructions for Splunk-maps-for-9x

## Issue Encountered

The GitHub App token currently doesn't have write permissions to push files directly to the repository. This is because the repository needs to explicitly grant access to the Abacus.AI GitHub App.

## Solution Options

You have **THREE options** to get the code into your GitHub repository:

---

## Option 1: Grant GitHub App Access (Recommended)

1. **Visit the GitHub App Installation Page:**
   https://github.com/apps/abacusai/installations/select_target

2. **Configure Repository Access:**
   - Find "Splunk-maps-for-9x" in the list
   - Grant access to the repository
   - Save your changes

3. **Return here and I'll push the code automatically**

---

## Option 2: Manual Push from Local Machine

All code is committed locally. You can push it from your local machine:

### Steps:

1. **Clone the repository locally:**
   ```bash
   git clone https://github.com/xanthakita/Splunk-maps-for-9x.git
   cd Splunk-maps-for-9x
   ```

2. **Download the packaged plugin:**
   - The complete plugin is packaged at: `/home/ubuntu/github_repos/splunk-maps-for-9x-plugin.tar.gz`
   - Download this file

3. **Extract and push:**
   ```bash
   # Extract the tarball
   tar -xzf splunk-maps-for-9x-plugin.tar.gz
   
   # Verify files
   ls -la
   
   # Git should show all files
   git status
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial release: Splunk 9.4.x Leaflet Maps visualization plugin"
   
   # Push to GitHub
   git push origin main
   ```

---

## Option 3: Manual Upload via GitHub Web UI

1. **Go to your repository:**
   https://github.com/xanthakita/Splunk-maps-for-9x

2. **Click "Add file" → "Upload files"**

3. **Upload the following files from `/home/ubuntu/github_repos/Splunk-maps-for-9x/`:**

   **Root Directory:**
   - `.gitignore`
   - `LICENSE`
   - `README.md`

   **appserver/static/visualizations/leaflet_map/:**
   - `formatter.html`
   - `visualization.css`
   - `visualization.js`

   **default/:**
   - `app.conf`
   - `visualizations.conf`

   **metadata/:**
   - `default.meta`

4. **Commit the changes with message:**
   ```
   Initial release: Splunk 9.4.x Leaflet Maps visualization plugin
   ```

---

## Current Status

✅ All plugin files are created and ready
✅ Git repository is initialized
✅ All files are committed locally
✅ Plugin is packaged and ready for distribution
⏳ Waiting for GitHub push (requires one of the options above)

## Files Ready to Push

```
Splunk-maps-for-9x/
├── .gitignore
├── LICENSE
├── README.md
├── appserver/
│   └── static/
│       └── visualizations/
│           └── leaflet_map/
│               ├── formatter.html
│               ├── visualization.css
│               └── visualization.js
├── default/
│   ├── app.conf
│   └── visualizations.conf
└── metadata/
    └── default.meta

Total: 9 files, 1,311+ lines of code
```

## Next Steps After Push

Once the code is pushed to GitHub:

1. **Install the plugin in Splunk:**
   ```bash
   cp -r /home/ubuntu/github_repos/Splunk-maps-for-9x $SPLUNK_HOME/etc/apps/
   $SPLUNK_HOME/bin/splunk restart
   ```

2. **Verify installation:**
   - Go to http://localhost:8000
   - Navigate to Settings → Data Visualizations
   - Look for "Leaflet Map"

3. **Test with sample data:**
   ```spl
   | makeresults count=10
   | eval latitude=35.0 + (random() % 1000) / 100.0
   | eval longitude=-92.0 - (random() % 1000) / 100.0
   | eval category=case(
       random() % 3 == 0, "highway",
       random() % 3 == 1, "rest_area",
       1=1, "school"
     )
   | eval description="Test Location " + _time
   | table description, latitude, longitude, category
   ```

## Need Help?

If you choose **Option 1** (recommended), just let me know once you've granted access and I'll complete the push for you!
