// Listens for toolbar icon clicks and injects a floating widget into the active tab.
chrome.action.onClicked.addListener(async (tab) => {
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY
// GET YOUR OWN API KEY

  try {
    // Check if widget already exists; if not, inject it. If it exists, do nothing so it "stays".
    const [{ result: exists } = { result: false }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.getElementById("__my_ext_widget__")
    });

    if (!exists) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Create container
          const container = document.createElement("div");
          container.id = "__my_ext_widget__";
          Object.assign(container.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            width: "320px",
            height: "240px",
            background: "#000000",
            border: "0px solid rgb(139, 92, 246)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: "2147483647",
            padding: "0",
            boxSizing: "border-box"
          });

          // Create close button
          const btn = document.createElement("button");
          btn.textContent = "X";
          btn.title = "Close";
          Object.assign(btn.style, {
            position: "absolute",
            top: "0",
            right: "0",
            width: "24px",
            height: "24px",
            padding: "0",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: "1",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#e53935",
            color: "#ffffff"
          });

          // Create a small last-updated element
          const lastUpdated = document.createElement("div");
          lastUpdated.id = "__my_ext_last_updated__";
          Object.assign(lastUpdated.style, {
            position: "absolute",
            top: "4px",
            left: "48px",
            fontSize: "11px",
            color: "#9ca3af",
            pointerEvents: "none",
            userSelect: "none"
          });
          lastUpdated.textContent = "Last update: -";

          btn.addEventListener("click", () => {
            // clear auto-refresh interval when widget is closed
            try {
              if (container._refreshInterval) {
                clearInterval(container._refreshInterval);
                container._refreshInterval = null;
              }
            } catch (e) { /* ignore */ }
            container.remove();
          });
          container.appendChild(btn);
          container.appendChild(lastUpdated);

          // Prev/Next controls
          const navWrap = document.createElement("div");
          Object.assign(navWrap.style, {
            position: "absolute",
            top: "0",
            left: "0",
            display: "flex"
          });
          
          const makeNavBtn = (label) => {
            const b = document.createElement("button");
            b.textContent = label;
            Object.assign(b.style, {
              width: "24px",
              height: "24px",
              padding: "0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              lineHeight: "1",
              cursor: "pointer",
              border: "1px solid rgba(0,0,0,0.15)",
              background: "#2563eb",
              color: "#ffffff"
            });
            return b;
          };
          
          const prevBtn = makeNavBtn("<");
          const nextBtn = makeNavBtn(">");
          navWrap.appendChild(prevBtn);
          navWrap.appendChild(nextBtn);
          container.appendChild(navWrap);

          // Create content area
          const content = document.createElement("div");
          Object.assign(content.style, {
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            padding: "12px",
            paddingTop: "32px",
            height: "calc(100% - 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflowY: "auto"
          });
          container.appendChild(content);
          document.documentElement.appendChild(container);


          // API URLs
          const RAPIDAPI_KEY = "ADD YOUR OWN KEY HERE FFS";
          const API_URL = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live";
          const ML_API_URL = "http://127.0.0.1:5000/predict";

          // Call ML model via background script
          const callMLModel = async (matchData) => {
            try {
              console.log("🎯 Calling ML API with:", matchData);
              const response = await chrome.runtime.sendMessage({
                type: 'CALL_ML_MODEL',
                url: ML_API_URL,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  Over: matchData.Over,
                  team1Score: matchData.team1Score,
                  team2Score: matchData.team2Score,
                  Number_of_wickets_fell: matchData.Number_of_wickets_fell,
                  ballsBowled: matchData.ballsBowled,
                  ballsRemaining: matchData.ballsRemaining,
                  runsRequired: matchData.runsRequired,
                  crr: matchData.crr,
                  rrr: matchData.rrr,
                  wicketsInHand: matchData.wicketsInHand
                })
              });
              
              if (!response.success) {
                console.error('❌ ML API error:', response.error);
                return null;
              }
              
              const prediction = response.data;
              console.log("✅ Prediction received:", prediction.win_prob ?? prediction.winProbability ?? prediction.probability);
              return prediction.win_prob ?? prediction.winProbability ?? prediction.probability ?? null;
            } catch (error) {
              console.error('❌ ML API call failed:', error);
              return null;
            }
          };

          // Convert overs to balls
          const oversToBalls = (oversStr) => {
            if (!oversStr) return 0;
            const parts = oversStr.toString().split('.');
            const completedOvers = parseInt(parts[0]) || 0;
            const ballsInCurrentOver = parseInt(parts[1]) || 0;
            return (completedOvers * 6) + ballsInCurrentOver;
          };

          // Process match data and get prediction
          const mapApiMatchToView = async (m) => {
            const mi = m.matchInfo || {};
            const ms = m.matchScore || {};
            const t1 = mi.team1 || {};
            const t2 = mi.team2 || {};
            const v = mi.venueInfo || {};

            const matchType = mi.matchFormat;
            const status = mi.status || mi.stateTitle || "";
            const team1Short = t1.teamSName || t1.teamName || "T1";
            const team2Short = t2.teamSName || t2.teamName || "T2";

            // Get scores for display
            const team1Innings = ms.team1Score?.inngs1;
            const team2Innings = ms.team2Score?.inngs1;
            
            const fmt = (s) => s ? `${s.runs}/${s.wickets} (${s.overs})` : "-";
            const score1 = fmt(team1Innings);
            const score2 = fmt(team2Innings);

            console.log("🔍 Processing:", team1Short, "vs", team2Short, "Format:", matchType, "Status:", status);

            let winProbability = null;
            let chasingTeam = null;

            // Only process ODI/T20 matches
            if (matchType === "ODI" || matchType === "T20") {
              // Check if second innings (chasing) is happening
              const isSecondInnings = team2Innings && team2Innings.inningsId === 2;
              
              console.log("📊 Innings check:", {
                team2InningsId: team2Innings?.inningsId,
                isSecondInnings: isSecondInnings,
                statusLower: status.toLowerCase()
              });

              if (isSecondInnings && !status.toLowerCase().includes('complete')) {
                const chasingScore = team2Innings;
                const targetScore = team1Innings;
                chasingTeam = team2Short;

                const totalOvers = matchType === "T20" ? 20 : 50;
                const currentRuns = chasingScore.runs || 0;
                const currentWickets = chasingScore.wickets || 0;
                const currentOvers = parseFloat(chasingScore.overs || 0);
                const targetRuns = (targetScore.runs || 0) + 1;

                const ballsBowled = oversToBalls(currentOvers);
                const totalBalls = totalOvers * 6;
                const ballsRemaining = totalBalls - ballsBowled;
                const runsRequired = targetRuns - currentRuns;
                const wicketsInHand = 10 - currentWickets;

                const crr = ballsBowled > 0 ? (currentRuns / ballsBowled) * 6 : 0;
                const rrr = ballsRemaining > 0 ? (runsRequired / ballsRemaining) * 6 : 0;

                console.log("🏏 Match stats:", {
                  currentRuns, currentWickets, currentOvers,
                  targetRuns, ballsBowled, ballsRemaining,
                  runsRequired, wicketsInHand, crr: crr.toFixed(2), rrr: rrr.toFixed(2)
                });

                // Only predict if match is still in play
                if (wicketsInHand > 0 && ballsRemaining > 0 && runsRequired > 0) {
                  const matchData = {
                    Over: currentOvers,
                    team1Score: targetScore.runs || 0,
                    team2Score: currentRuns,
                    Number_of_wickets_fell: currentWickets,
                    ballsBowled: ballsBowled,
                    ballsRemaining: ballsRemaining,
                    runsRequired: runsRequired,
                    crr: parseFloat(crr.toFixed(2)),
                    rrr: parseFloat(rrr.toFixed(2)),
                    wicketsInHand: wicketsInHand
                  };

                  winProbability = await callMLModel(matchData);
                } else {
                  console.log("⏹️ Match over or invalid state");
                }
              } else if (isSecondInnings) {
                console.log("✅ Second innings but match complete");
              } else {
                console.log("⏳ First innings - waiting for chase");
              }
            } else {
              console.log("🚫 Test match - skipping ML prediction");
            }

            return {
              matchType,
              status,
              venue: v.ground || v.city || "",
              team1Short,
              team2Short,
              score1,
              score2,
              winProbability,
              chasingTeam
            };
          };

          // Render match in widget
          const renderMatch = (vm) => {
            console.log("🎨 Rendering:", vm.team1Short, "vs", vm.team2Short, "Win prob:", vm.winProbability);

            content.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="text-align: center; flex: 1; font-weight: 600; font-size: 15px;">${vm.team1Short} vs ${vm.team2Short}</div>
                <div style="text-align: right; font-weight: 600; font-size: 10px; color: #9ca3af;">${vm.venue}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
                <div>${vm.team1Short}</div>
                <div style="font-weight: 600;">${vm.score1}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <div>${vm.team2Short}</div>
                <div style="font-weight: 600;">${vm.score2}</div>
              </div>
              <div style="text-align: center; font-size: 11px; color: #e5e7eb; margin-bottom: 8px;">${vm.status}</div>
              
              ${vm.winProbability !== null && vm.winProbability !== undefined ? `
                <div style="
                  margin-top: 8px; 
                  padding: 12px; 
                  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1)); 
                  border-radius: 8px;
                  text-align: center;
                  border: 1px solid rgba(34, 197, 94, 0.4);
                  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
                ">
                  <div style="font-size: 10px; color: #86efac; margin-bottom: 4px; letter-spacing: 0.5px; font-weight: 600;">
                    🎯 ${vm.chasingTeam} WIN PROBABILITY
                  </div>
                  <div style="font-size: 26px; font-weight: 700; color: #22c55e;">
                    ${(vm.winProbability * 100).toFixed(1)}%
                  </div>
                </div>
              ` : vm.matchType !== "TEST" && vm.status && !vm.status.toLowerCase().includes('complete') ? `
                <div style="
                  margin-top: 8px; 
                  padding: 12px; 
                  background: rgba(59, 130, 246, 0.1); 
                  border-radius: 8px;
                  text-align: center;
                  border: 1px solid rgba(59, 130, 246, 0.3);
                ">
                  <div style="font-size: 11px; color: #93c5fd;">⏳ Prediction available in 2nd innings</div>
                </div>
              ` : ''}
            `;
          };

          // Navigation
          let matches = [];
          let idx = 0;
          
          const showIdx = async (i) => {
            if (!matches.length) return;
            idx = (i + matches.length) % matches.length;
            content.innerHTML = "<div style='text-align:center; color: #9ca3af;'>⚡ Loading...</div>";
            const viewModel = await mapApiMatchToView(matches[idx]);
            renderMatch(viewModel);
          };

          prevBtn.addEventListener("click", (e) => { 
            e.stopPropagation(); 
            showIdx(idx - 1); 
          });
          
          nextBtn.addEventListener("click", (e) => { 
            e.stopPropagation(); 
            showIdx(idx + 1); 
          });

          // Fetch and display matches via background script
          const fetchAndUpdate = async () => {
            try {
              lastUpdated.textContent = "Updating…";
              const response = await chrome.runtime.sendMessage({
                type: 'FETCH_MATCHES',
                url: API_URL,
                headers: {
                  "x-rapidapi-key": RAPIDAPI_KEY,
                  "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
                }
              });

              if (!response.success) {
                throw new Error(response.error || 'Failed to fetch');
              }

              const json = response.data;

              // Flatten match structure
              const typeMatches = (json && json.typeMatches) || [];
              const flat = [];
              
              for (const tm of typeMatches) {
                const seriesMatches = tm.seriesMatches || [];
                for (const sm of seriesMatches) {
                  const sw = sm.seriesAdWrapper;
                  if (sw && Array.isArray(sw.matches)) {
                    for (const m of sw.matches) {
                      // FILTER: Only include T20 and ODI matches
                      const matchFormat = m.matchInfo?.matchFormat;
                      if ((matchFormat === "T20" || matchFormat === "ODI") && (m.matchInfo || m.matchScore)) {
                        flat.push(m);
                      }
                    }
                  }
                }
              }

              if (!flat.length) {
                content.innerHTML = "<div style='text-align:center;color:#e5e7eb;'>No T20/ODI matches available</div>";
                lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
                matches = [];
                return;
              }

              // Update matches and keep current index sane
              const prevLen = matches.length;
              matches = flat;
              if (idx >= matches.length) idx = 0;

              // If this is the first load or matches changed, show current index
              if (!prevLen || prevLen !== matches.length) {
                await showIdx(idx);
              } else {
                // refresh current view so predictions/stats update
                await showIdx(idx);
              }

              lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            } catch (error) {
              console.error("Failed to fetch matches:", error);
              content.innerHTML = "<div style='text-align:center;color:#ff6b6b;'>Error loading matches</div>";
              lastUpdated.textContent = `Update failed: ${new Date().toLocaleTimeString()}`;
            }
          };

          
          fetchAndUpdate();
          try {
            const intervalId = setInterval(fetchAndUpdate, 6000000);
            // store interval id on container so we can clear it when widget is closed
            container._refreshInterval = intervalId;
          } catch (e) {
            console.warn("Auto-refresh not started", e);
          }
        }
      });
    }
  } catch (e) {
    console.error("Widget injection failed", e);
  }
});

// Message listener for API calls from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_MATCHES') {
    fetch(request.url, {
      headers: request.headers
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async sendResponse
  }
  
  if (request.type === 'CALL_ML_MODEL') {
    fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: request.body
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async sendResponse
  }
});
