feat: Integrate BomCast Scheduler into BoomServer; Enable Core Live TV Scheduling



This commit introduces the initial integration of the BomCast live TV scheduler directly into the BoomServer application, transforming it from a media manager into a powerful live streaming content preparation tool.



Key Features \& Enhancements:



\- \*\*Unified Architecture\*\*: BomCast's scheduling logic and UI are now a core part of the BoomServer application.

\- \*\*Visual Scheduler (Alpha)\*\*:

&nbsp;   - New "Scheduler" tab with a basic timeline visualization.

&nbsp;   - Timeline displays channels as rows with content blocks representing scheduled media.

&nbsp;   - Time axis formatted in 12-hour AM/PM, showing 1-hour intervals with 250px/hour scaling.

&nbsp;   - Scheduler view and available media are vertically stacked for better overview.

\- \*\*Automated Content Assignment\*\*:

&nbsp;   - "Add All Ads" button automatically assigns Ad Bumps to the "Ad Content" channel.

&nbsp;   - "Add All Main" button automatically assigns TV Shows, Movies, and Uncategorized content to the "Main Channel".

&nbsp;   - Individual '+' buttons intelligently auto-assign media to suggested channels (Ad Bumps to Ad Content, TV Shows/Others to Main) based on categorization.

\- \*\*Schedule Management\*\*:

&nbsp;   - "Clear Schedule" button for quick resets.

&nbsp;   - Basic "Shuffle Schedule" button (currently shuffles within each channel).

&nbsp;   - Clickable scheduled blocks on the timeline open an editor to adjust start time (in seconds) and channel.

&nbsp;   - Real-time updates for adding, removing, and editing scheduled items on the timeline.

\- \*\*Ad Options\*\*:

&nbsp;   - UI for configuring "Enable Ad Breaks", "Ad Frequency" (e.g., every 5, 10 min), and "Ad Duration" (e.g., 30s, 1 min).

&nbsp;   - Persistence of ad options in the BomCast database.

\- \*\*M3U/EPG Generation\*\*:

&nbsp;   - \*\*Successful generation of M3U and EPG files!\*\*

&nbsp;   - Implemented core ad insertion logic into generated M3U/EPG, dynamically splitting main content and inserting ad breaks based on configured options.

&nbsp;   - Generated files use "Public Stream Base URL" (defaults to localhost:8000) for media paths.

&nbsp;   - BoomServer now serves generated M3U/EPG files via `/bomcast\_playlists/` and `/bomcast\_epgs/` endpoints.

&nbsp;   - BoomServer now serves actual media files from library paths via `/media/:filename` endpoint.



Known Flaws \& Future Improvements:



\- \*\*MUI Grid Warnings\*\*: Frontend console displays warnings about deprecated Material-UI Grid props (`item`, `xs`, `sm`). (UI cleanup).

\- \*\*HTML Nesting Warnings\*\*: Frontend console displays warnings about invalid HTML nesting (e.g., `div` inside `tbody` in `LibraryViewer.jsx`). (UI cleanup).

\- \*\*Ad Shuffle Scope\*\*: "Shuffle Schedule" currently shuffles content within \*all\* channels; desired behavior is to shuffle only main channel content.

\- \*\*Ad Redirect Visualization\*\*: The timeline does not yet explicitly visualize the ad break insertions as distinct blocks interrupting the Main Channel's content.

\- \*\*Advanced Ad Logic\*\*: No advanced ad selection (e.g., avoiding recently played ads, randomized selection within break duration, specific ad rotations).

\- \*\*M3U/EPG Generation Limit\*\*: Generation is currently capped at 1 hour (MAX\_GENERATE\_DURATION) to prevent out-of-memory crashes. A more robust solution for generating longer (e.g., daily) schedules efficiently is needed.

\- \*\*No Built-in Player/Broadcaster\*\*: External media player (VLC) is needed for M3U playback. True continuous live broadcasting requires separate streaming software.

\- \*\*Installer Icon Issue\*\*: Inno Setup Compiler requires `SetupIconFile` directive to be omitted from the .iss file to compile. The installer .exe itself will have a default icon, but shortcuts use the custom icon.

