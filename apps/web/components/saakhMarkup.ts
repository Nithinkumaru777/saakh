export const SAAKH_MARKUP = `
<!-- ink texture filter for the stamp -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="inkTex" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75" result="holes"/>
    <feComposite in="d" in2="holes" operator="in"/>
  </filter>
</svg>

<div class="app">
  <aside class="rail" aria-label="Main navigation">
    <a class="brand" href="#home" aria-label="Saakh home">
      <span class="brand-mark" data-icon="stamp" data-s="16"></span>
      <span class="brand-name">Saakh</span>
    </a>
    <nav class="nav" id="nav">
      <span class="nav-pill" id="navPill" aria-hidden="true"></span>
      <a class="ih" href="#assess" data-route="assess"><i data-icon="file-check" data-a="draw"></i><span>Assess</span></a>
      <a class="ih" href="#what-if" data-route="what-if"><i data-icon="sliders-horizontal" data-a="nudge-x"></i><span>What-if</span></a>
      <a class="ih" href="#applicants" data-route="applicants"><i data-icon="users" data-a="pop"></i><span>Applicants</span></a>
      <a class="ih" href="#batch" data-route="batch"><i data-icon="cloud-upload" data-a="nudge-y"></i><span>Batch</span></a>
      <a class="ih" href="#portfolio" data-route="portfolio"><i data-icon="chart-column-increasing" data-a="bars"></i><span>Portfolio</span></a>
      <a class="ih" href="#model" data-route="model"><i data-icon="brain" data-a="pulse"></i><span>Model</span></a>
      <span class="nav-sep" aria-hidden="true"></span>
      <a class="ih" href="#tutorials" data-route="tutorials"><i data-icon="play" data-a="pop"></i><span>Tutorials</span></a>
      <a class="ih" href="#about" data-route="about"><i data-icon="circle-help" data-a="wiggle"></i><span>About</span></a>
    </nav>
    <div class="rail-foot"><div id="railAuth" class="rail-auth"></div>AI for Finance CIA-2<br>Nithin Kumar U<br>USN 2102508611</div>
  </aside>

  <div class="main">
    <header class="topbar">
      <a class="brand topbar-brand" href="#home" style="padding:0;text-decoration:none" aria-label="Saakh home"><span class="brand-mark" data-icon="stamp" data-s="16"></span><span class="brand-name" style="font-size:20px">Saakh</span></a>
      <span class="topbar-sep" style="color:var(--rule-strong);margin:0 4px">/</span>
      <span class="crumb" id="crumb">Assess</span>
      <span class="grow"></span>
      <span class="livefeed" id="liveFeed" data-state="connecting" role="status" title="Live updates: new assessments from other desks appear without a reload"><span class="pulse" aria-hidden="true"></span><span class="txt">Connecting</span></span>
      <button class="btn btn-ghost btn-sm ih" id="tourBtn"><i data-icon="play" data-a="pop" data-s="16"></i><span class="lbl">Guided demo</span></button>
      <button class="btn btn-secondary btn-sm ih" id="cmdBtn" aria-label="Open command palette"><i data-icon="search" data-a="wiggle" data-s="16"></i><span class="lbl">Search</span><span class="kbd">Ctrl K</span></button>
      <a class="btn btn-secondary btn-sm" id="authBtn" href="#login">Sign in</a>
      <button class="iconbtn ih" id="themeBtn" aria-label="Switch to dark theme"><i data-icon="sun-moon" data-a="spin"></i></button>
    </header>

    <main class="content" id="content">

<!-- ======================= HOME ======================= -->
<section class="view" data-view="home" aria-label="Home">
  <header class="land-top">
    <a class="brand" href="#home" style="padding:0"><span class="brand-mark" data-icon="stamp" data-s="16"></span><span class="brand-name">Saakh</span></a>
    <span class="grow"></span>
    <a class="btn btn-ghost btn-sm" href="#about">About the project</a>
    <a class="btn btn-secondary btn-sm" id="landAuth" href="#login">Sign in</a>
    <button class="iconbtn ih" data-theme-toggle aria-label="Switch theme"><i data-icon="sun-moon" data-a="spin"></i></button>
  </header>
  <div class="land-hero">
    <h1>Know the risk before you lend.</h1>
    <p class="lede">Saakh reads a loan application, estimates the chance of default, and shows exactly which factors moved the decision.</p>
    <div class="demo-label"><i></i>Change any underlined value</div>
    <p class="sentence" id="sentence">
      A <label class="sr" for="sEmp">Employment</label><select class="inl" id="sEmp" style="width:6.6em"><option value="salaried">salaried</option><option value="self_employed">self-employed</option><option value="business_owner">business-owner</option></select>
      applicant earning ₹<label class="sr" for="sInc">Monthly income</label><input class="inl" id="sInc" data-money inputmode="numeric" value="85000" style="width:5.2em">
      a month, with a CIBIL score of <label class="sr" for="sCib">CIBIL score</label><input class="inl" id="sCib" inputmode="numeric" value="760" style="width:2.6em">,
      asks for ₹<label class="sr" for="sAmt">Loan amount</label><input class="inl" id="sAmt" data-money inputmode="numeric" value="800000" style="width:5.6em">
      over <label class="sr" for="sTen">Tenure in months</label><input class="inl" id="sTen" inputmode="numeric" value="48" style="width:1.9em"> months.
    </p>
    <div class="verdict" aria-live="polite">
      <div class="vrow">
        <span class="vpd" id="vPd">4.1%</span>
        <span class="vtxt">estimated chance of default</span>
        <span class="gchip big" id="vGrade"></span>
        <span id="vOut"></span>
      </div>
      <div id="heroRuler"></div>
    </div>
    <div class="hero-ctas">
      <a class="btn btn-primary ih" href="#assess"><i data-icon="stamp" data-a="press"></i><span class="lbl">Assess a full application</span></a>
      <a class="btn btn-secondary ih" href="#model"><i data-icon="brain" data-a="pulse"></i><span class="lbl">See how the AI decides</span></a>
    </div>
  </div>
  <section class="band" aria-label="How Saakh decides">
    <h2>How a decision is made</h2>
    <ol>
      <li><span class="n">1</span><h3>Policy rules</h3><p>Six hard limits, such as EMIs above 65% of income, decline straight away.</p></li>
      <li><span class="n">2</span><h3>Features</h3><p>Income, debts and the loan become ratios lenders use: FOIR, loan-to-income, loan-to-value.</p></li>
      <li><span class="n">3</span><h3>Risk model</h3><p>A gradient-boosted model estimates the probability of default within a year.</p></li>
      <li><span class="n">4</span><h3>Explanation</h3><p>SHAP values show how much each input raised or lowered that risk.</p></li>
      <li><span class="n">5</span><h3>Decision</h3><p>Grade A to E sets the outcome, the indicative rate and the maximum amount.</p></li>
    </ol>
  </section>
  <footer class="land-foot"><span>AI for Finance, CIA-2. Topic 4: AI-based loan eligibility and risk assessment.</span><span>Nithin Kumar U, USN 2102508611</span><span id="apiStatusBadge">Live Engine: Calibrated Monotone XGBoost + TreeSHAP</span></footer>
</section>

<!-- ======================= ASSESS ======================= -->
<section class="view" data-view="assess" aria-label="Assess an application">
  <div class="page-head"><div class="grow"><h1 class="display-m">Assess an application</h1><p>The sheet shows the current estimate as you fill in the four steps. Run the assessment to record a decision.</p></div></div>
  <div class="assess">
    <div class="panel stepcard">
      <div class="persona-row">
        <div class="field"><label for="persona">Load sample applicant</label>
          <select class="ctl" id="persona"><option value="">Choose a demo persona</option></select></div>
        <button class="btn btn-ghost ih" id="clearForm"><i data-icon="refresh-cw" data-a="spin"></i><span class="lbl">Clear</span></button>
      </div>
      <div class="stepper" id="stepper"></div>
      <div class="stage" id="stage">
        <div class="pane" data-step="0">
          <h2 class="title">Applicant</h2><p class="lead">Who is applying.</p>
          <div class="fgrid">
            <div class="field full"><label for="f_name">Full name</label><input class="ctl" id="f_name" data-k="full_name" autocomplete="off"><div class="errmsg"><div></div></div><span class="help">As on PAN card</span></div>
            <div class="field"><label for="f_age">Age</label><input class="ctl" id="f_age" data-k="age" inputmode="numeric"><div class="errmsg"><div></div></div><span class="help">21 to 75</span></div>
            <div class="field"><label for="f_job">Years in current job or business</label><input class="ctl" id="f_job" data-k="years_in_job" inputmode="decimal"><div class="errmsg"><div></div></div><span class="help"></span></div>
            <div class="field full"><span class="lab" id="l_emp">Employment</span><div class="seg" data-seg="employment_type" aria-labelledby="l_emp"><span class="seg-ind"></span>
              <button type="button" data-v="salaried" class="ih"><i data-icon="id-card" data-a="pop" data-s="16"></i>Salaried</button>
              <button type="button" data-v="self_employed" class="ih"><i data-icon="briefcase-business" data-a="nudge-y" data-s="16"></i>Self-employed</button>
              <button type="button" data-v="business_owner" class="ih"><i data-icon="hand-coins" data-a="nudge-y" data-s="16"></i>Business owner</button></div></div>
            <div class="field"><label for="f_tier">City</label><select class="ctl" id="f_tier" data-k="city_tier"><option value="1">Tier 1 metro</option><option value="2">Tier 2 city</option><option value="3">Tier 3 town</option></select><span class="help"></span></div>
            <div class="field"><label for="f_dep">Dependents</label><input class="ctl" id="f_dep" data-k="dependents" inputmode="numeric"><div class="errmsg"><div></div></div><span class="help">0 to 6</span></div>
            <div class="field full"><span class="lab" id="l_res">Residence</span><div class="seg" data-seg="residence" aria-labelledby="l_res"><span class="seg-ind"></span>
              <button type="button" data-v="owned">Owned</button><button type="button" data-v="rented">Rented</button><button type="button" data-v="family">With family</button></div></div>
          </div>
        </div>
        <div class="pane" data-step="1">
          <h2 class="title">Income</h2><p class="lead">Take-home pay after tax. Other income is counted at half its value.</p>
          <div class="fgrid">
            <div class="field full"><label for="f_inc">Monthly net income</label><div class="money"><input class="ctl" id="f_inc" data-k="monthly_income" data-money inputmode="numeric"></div><div class="errmsg"><div></div></div><span class="words" data-words="f_inc"></span></div>
            <div class="field full"><label for="f_oth">Other monthly income</label><div class="money"><input class="ctl" id="f_oth" data-k="other_monthly_income" data-money inputmode="numeric"></div><div class="errmsg"><div></div></div><span class="words" data-words="f_oth"></span></div>
          </div>
        </div>
        <div class="pane" data-step="2">
          <h2 class="title">Credit and debts</h2><p class="lead">From the applicant's CIBIL report and loan statements.</p>
          <div class="fgrid">
            <div class="field"><label for="f_cibil">CIBIL score</label><input class="ctl" id="f_cibil" data-k="cibil_score" inputmode="numeric"><div class="errmsg"><div></div></div><span class="help">300 to 900</span></div>
            <div class="field" style="justify-content:flex-end"><label class="switch"><input type="checkbox" id="f_ntc"><span class="trk"></span>New to credit</label><span class="help"></span></div>
            <div class="field"><label for="f_hist">Credit history (years)</label><input class="ctl" id="f_hist" data-k="credit_history_years" inputmode="decimal"><div class="errmsg"><div></div></div><span class="help"></span></div>
            <div class="field"><label for="f_lines">Open credit lines</label><input class="ctl" id="f_lines" data-k="open_credit_lines" inputmode="numeric"><span class="help"></span></div>
            <div class="field"><label for="f_util">Card limit used (%)</label><input class="ctl" id="f_util" data-k="credit_utilisation_pct" inputmode="decimal"><div class="errmsg"><div></div></div><span class="help">0 to 100</span></div>
            <div class="field"><label for="f_miss">Missed payments, last 24 months</label><input class="ctl" id="f_miss" data-k="missed_payments_24m" inputmode="numeric"><span class="help"></span></div>
            <div class="field"><label for="f_enq">Credit enquiries, last 6 months</label><input class="ctl" id="f_enq" data-k="enquiries_6m" inputmode="numeric"><span class="help"></span></div>
            <div class="field" style="justify-content:flex-end"><label class="switch"><input type="checkbox" id="f_def"><span class="trk"></span>Has defaulted before</label><span class="help"></span></div>
            <div class="field"><label for="f_emi">Existing EMIs per month</label><div class="money"><input class="ctl" id="f_emi" data-k="existing_emi" data-money inputmode="numeric"></div><span class="words" data-words="f_emi"></span></div>
            <div class="field"><label for="f_out">Outstanding loan balance</label><div class="money"><input class="ctl" id="f_out" data-k="outstanding_debt" data-money inputmode="numeric"></div><span class="words" data-words="f_out"></span></div>
          </div>
        </div>
        <div class="pane" data-step="3">
          <h2 class="title">Loan request</h2><p class="lead">What the applicant wants to borrow.</p>
          <div class="fgrid">
            <div class="field full"><span class="lab" id="l_type">Loan type</span><div class="seg" data-seg="loan_type" aria-labelledby="l_type"><span class="seg-ind"></span>
              <button type="button" data-v="personal" class="ih"><i data-icon="wallet" data-a="pop" data-s="16"></i>Personal</button>
              <button type="button" data-v="home" class="ih"><i data-icon="house" data-a="pop" data-s="16"></i>Home</button>
              <button type="button" data-v="auto" class="ih"><i data-icon="car" data-a="nudge-x" data-s="16"></i>Auto</button>
              <button type="button" data-v="education" class="ih"><i data-icon="graduation-cap" data-a="wiggle" data-s="16"></i>Education</button>
              <button type="button" data-v="business" class="ih"><i data-icon="briefcase-business" data-a="nudge-y" data-s="16"></i>Business</button></div></div>
            <div class="field"><label for="f_amt">Loan amount</label><div class="money"><input class="ctl" id="f_amt" data-k="loan_amount" data-money inputmode="numeric"></div><div class="errmsg"><div></div></div><span class="words" data-words="f_amt"></span></div>
            <div class="field"><label for="f_ten">Tenure (months)</label><input class="ctl" id="f_ten" data-k="tenure_months" inputmode="numeric"><div class="errmsg"><div></div></div><span class="help" id="tenHelp"></span></div>
            <div class="field full" id="collField"><label for="f_col">Value of the home or vehicle</label><div class="money"><input class="ctl" id="f_col" data-k="collateral_value" data-money inputmode="numeric"></div><div class="errmsg"><div></div></div><span class="words" data-words="f_col"></span></div>
            <div class="field full"><label for="f_pur">Purpose (optional)</label><input class="ctl" id="f_pur" data-k="purpose" maxlength="200"><span class="help"></span></div>
          </div>
        </div>
      </div>
      <div class="stepnav">
        <button class="btn btn-secondary ih" id="backBtn"><i data-icon="arrow-left" data-a="nudge-x"></i><span class="lbl">Back</span></button>
        <button class="btn btn-primary ih" id="nextBtn"><span class="lbl">Continue</span><i data-icon="chevron-right" data-a="nudge-x"></i></button>
      </div>
    </div>

    <div class="sheet asheet" id="asheet">
      <button class="peek" id="peek" aria-label="Show assessment sheet" type="button"><span class="grab"></span><span class="gchip" id="peekGrade"></span><span class="grow tnum" id="peekTxt"></span><i data-icon="chevron-right" style="transform:rotate(-90deg)"></i></button>
      <div class="scan" id="scan"></div>
      <div class="stamp" id="stamp" aria-hidden="true"><span class="inkring"></span><b id="stampWord">SANCTIONED</b><small id="stampDate"></small></div>
      <div class="sh-head"><h2 class="subtitle grow">Assessment sheet</h2><span class="live" id="live"><i></i>Live estimate</span></div>
      <div class="headline" id="headline"><span class="ph">Run the assessment to record a decision.</span><h2 class="display-l" id="headTxt"></h2></div>
      <div class="sh-figs">
        <div><div class="k">Estimated chance of default</div><div class="bigpd" id="pdVal">0.0%</div></div>
        <div style="padding-bottom:10px"><div class="k" style="margin-bottom:6px">Risk grade</div><span class="gchip big" id="gradeChip"></span></div>
      </div>
      <div id="mainRuler"></div>
      <div class="kv4">
        <div><div class="k">EMI</div><div class="v" id="emiVal">₹0</div></div>
        <div><div class="k">Indicative rate</div><div class="v" id="rateVal">0%</div></div>
        <div><div class="k">EMI to income</div><div class="v" id="foirVal">0%</div></div>
        <div><div class="k">Max eligible</div><div class="v" id="maxVal">₹0</div></div>
      </div>
      <div class="sh-div"></div>
      <div class="reasons" id="reasons"></div>
      <div class="fhead"><h3>What moved the score</h3><div class="fleg"><span><i style="background:var(--ink)"></i>Lowers risk</span><span><i style="background:var(--haldi)"></i>Raises risk</span><span>Percentage points</span></div></div>
      <div class="fbars" id="fbars"></div>
      <div class="sh-foot">
        <button class="btn btn-ghost ih" id="toWhatIf"><i data-icon="sliders-horizontal" data-a="nudge-x"></i><span class="lbl">Try changes</span></button>
        <button class="btn btn-secondary btn-sm ih" id="shPdf" style="display:none"><i data-icon="download" data-a="nudge-y" data-s="16"></i><span class="lbl">Download PDF</span><span class="state load"><i data-icon="loader-circle" data-cls="spin"></i></span><span class="state ok"><span style="display:flex;gap:8px;align-items:center"><i data-icon="check" data-raw></i>PDF downloaded</span></span></button>
        <span class="grow"></span>
        <button class="btn btn-primary ih" id="runBtn" style="min-width:200px"><i data-icon="stamp" data-a="press"></i><span class="lbl">Run assessment</span><span class="state load"><i data-icon="loader-circle" data-cls="spin"></i></span><span class="state ok"><span style="display:flex;gap:8px;align-items:center"><i data-icon="check" data-raw></i>Assessment saved</span></span></button>
      </div>
    </div>
  </div>
</section>

<!-- ======================= WHAT-IF ======================= -->
<section class="view" data-view="what-if" aria-label="What-if simulator">
  <div class="page-head"><div class="grow"><h1 class="display-m">What if the numbers changed?</h1><p>Move a slider to see how the grade responds. Start from the application on the Assess page.</p></div>
    <button class="btn btn-secondary ih" id="wiReset"><i data-icon="refresh-cw" data-a="spin"></i><span class="lbl">Reset to application</span></button></div>
  <div class="wi">
    <div class="panel sliders" id="wiSliders"></div>
    <div>
      <div class="sheet" style="padding:22px 24px">
        <div class="sh-figs"><div><div class="k">Estimated chance of default</div><div class="bigpd" id="wiPd">0%</div></div>
          <div style="padding-bottom:10px"><div class="k" style="margin-bottom:6px">Risk grade</div><span class="gchip big" id="wiGrade"></span></div>
          <div style="padding-bottom:14px"><div class="k" style="margin-bottom:6px">Outcome</div><div id="wiOutcome"></div></div></div>
        <div id="wiRuler"></div>
        <div class="kv4" style="grid-template-columns:1fr 1fr"><div><div class="k">EMI</div><div class="v" id="wiEmi">₹0</div></div><div><div class="k">EMIs vs income</div><div class="v" id="wiFoir">0%</div></div></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:32px"><i data-icon="trending-up" data-a="draw" style="color:var(--sanction)"></i><h2 class="subtitle">Paths to a better grade</h2></div>
      <div class="cf" id="cfList"></div>
    </div>
  </div>
</section>

<!-- ======================= APPLICANTS ======================= -->
<section class="view" data-view="applicants" aria-label="Applicants">
  <div id="appList">
    <div class="page-head"><div class="grow"><h1 class="display-m">Applicants</h1><p>Every assessment you have run, newest first.</p></div>
      <a class="btn btn-primary ih" href="#assess"><i data-icon="file-check" data-a="draw"></i><span class="lbl">New assessment</span></a></div>
    <div class="panel">
      <div class="toolbar">
        <div class="search"><i data-icon="search" data-s="20"></i><label class="sr" for="q">Search by name</label><input class="ctl" id="q" placeholder="Search by name"></div>
        <div class="seg" data-seg="filter" id="fseg"><span class="seg-ind"></span><button type="button" data-v="ALL">All</button><button type="button" data-v="SANCTIONED">Sanctioned</button><button type="button" data-v="REFER">Refer</button><button type="button" data-v="DECLINED">Declined</button></div>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Applicant</th><th>Loan</th><th class="num">Amount</th><th>Grade</th><th>Decision</th><th class="num">Risk</th><th>Date</th></tr></thead><tbody id="tbody"></tbody></table></div>
      <div id="tblEmpty"></div>
      <div class="pager"><span id="pinfo"></span><span style="display:flex;gap:8px"><button class="btn btn-secondary btn-sm" id="pprev">Previous</button><button class="btn btn-secondary btn-sm" id="pnext">Next</button></span></div>
    </div>
  </div>
  <div id="appDetail" hidden></div>
</section>

<!-- ======================= BATCH ======================= -->
<section class="view" data-view="batch" aria-label="Batch scoring">
  <div class="page-head"><div class="grow"><h1 class="display-m">Score a batch</h1><p>Upload a CSV of applications. Valid rows are scored; rows with problems are listed with the reason.</p></div>
    <button class="btn btn-secondary ih" id="tplBtn"><i data-icon="download" data-a="nudge-y"></i><span class="lbl">Download CSV template</span></button></div>
  <div class="drop" id="drop">
    <i data-icon="cloud-upload" data-s="40" class="play-on-hover"></i>
    <h3>Drop a CSV file here</h3>
    <p>Up to 5,000 rows, using the template columns.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <label class="btn btn-secondary ih" for="file"><i data-icon="upload" data-a="nudge-y"></i><span class="lbl">Choose file</span></label><input type="file" id="file" accept=".csv" class="sr">
      <button class="btn btn-primary ih" id="sampleBtn"><i data-icon="file-check" data-a="draw"></i><span class="lbl">Use the 50-row sample</span></button>
    </div>
  </div>
  <div id="batchOut"></div>
</section>

<!-- ======================= PORTFOLIO ======================= -->
<section class="view" data-view="portfolio" aria-label="Portfolio">
  <div class="page-head"><div class="grow"><h1 class="display-m">Portfolio</h1><p>All stored assessments together: how many were approved, how risky the book is, and where the risk sits.</p></div></div>
  <div class="kpis" id="kpis"></div>
  <div class="charts">
    <div class="panel chart"><h3>Applications by grade</h3><p class="sub">Count of assessments in each risk grade</p><svg id="chGrade" viewBox="0 0 520 240"></svg></div>
    <div class="panel chart"><h3>Default risk distribution</h3><p class="sub">Number of applicants per 5-point band of estimated default risk</p><svg id="chHist" viewBox="0 0 520 240"></svg></div>
    <div class="panel chart"><h3>Decisions by loan type</h3><p class="sub">Share sanctioned, referred and declined</p><svg id="chType" viewBox="0 0 520 240"></svg></div>
    <div class="panel chart"><h3>EMI burden against risk</h3><p class="sub">Each dot is an applicant: EMIs as a share of income vs estimated default risk</p><svg id="chScatter" viewBox="0 0 520 240"></svg></div>
  </div>
</section>

<!-- ======================= MODEL ======================= -->
<section class="view" data-view="model" aria-label="How the AI decides">
  <div class="page-head"><div class="grow"><h1 class="display-m">How the AI decides</h1><p>Policy rules screen the application, a gradient-boosted model estimates default risk, and SHAP values explain each prediction.</p></div></div>
  <div class="tabs" role="tablist" id="mtabs"><span class="ul" id="mtabUl"></span>
    <button role="tab" aria-selected="true" data-t="pipe">Pipeline</button><button role="tab" aria-selected="false" data-t="perf">Performance</button><button role="tab" aria-selected="false" data-t="imp">Explainability</button><button role="tab" aria-selected="false" data-t="card">Model card</button></div>
  <div class="tabpanel on" data-p="pipe">
    <div class="pipe" id="pipe"></div>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <button class="btn btn-primary ih" id="traceBtn"><i data-icon="workflow" data-a="pop"></i><span class="lbl">Trace an application</span></button>
      <select class="ctl" id="tracePersona" aria-label="Choose applicant to trace" style="width:auto;min-width:260px"></select>
    </div>
    <p class="small" style="margin-top:10px" id="traceSub">Sends the selected application through each stage of the live underwriting engine. Click any stage above to inspect its computation.</p>
    <div class="panel" id="pipeInspector" style="margin-top:20px;padding:24px;display:none"></div>
  </div>
  <div class="tabpanel" data-p="perf">
    <div class="kpis" id="modelKpis" style="margin-bottom:24px"></div>
    <div class="charts">
      <div class="panel chart"><h3>ROC curve</h3><p class="sub" id="aucSub"></p><svg id="chRoc" viewBox="0 0 520 300"></svg></div>
      <div class="panel chart"><h3>Confusion matrix at the grade E cut-off</h3><p class="sub">Predicted high risk means estimated default risk of 30% or more</p><div class="cm" id="cm"></div><p class="small" style="margin-top:16px" id="cmSub">Held-out test metrics from trained Monotone XGBoost + Platt Calibration model.</p></div>
    </div>
  </div>
  <div class="tabpanel" data-p="imp"><div class="panel chart"><h3>Which inputs matter most</h3><p class="sub">Average absolute effect on default risk across the sample (mean |SHAP|, percentage points)</p><svg id="chImp" viewBox="0 0 640 330"></svg></div></div>
  <div class="tabpanel" data-p="card"><div class="panel" style="padding:28px"><div class="mc">
    <h4>Intended use</h4><p>Helps a loan officer screen retail loan applications and explains the result to the applicant. It supports the decision; a person makes the final call on referred cases.</p>
    <h4>Model</h4><p>XGBoost classifier with monotone constraints (a higher CIBIL score can never raise risk; higher EMIs, utilisation, missed payments and enquiries can never lower it), calibrated with Platt scaling. Logistic regression is kept as a baseline.</p>
    <h4>Data</h4><p>5,000 synthetic applicants modelled on Indian retail lending ranges, generated with a fixed seed so results are reproducible. Split 70/15/15 for training, calibration and testing.</p>
    <h4>Inputs</h4><p>CIBIL score, credit history, utilisation, missed payments, enquiries, past default, EMI-to-income ratio, loan-to-income, loan-to-value, debt-to-income, employment, tenure, dependents, residence, city tier and loan type.</p>
    <h4>Explanations</h4><p>SHAP TreeExplainer gives each input's contribution to a single prediction. Contributions are converted to percentage points of default risk and written as plain sentences.</p>
    <h4>Not used</h4><p>Gender, religion, caste and other protected attributes are never collected or used.</p>
    <h4>Limitations</h4><p>Trained on synthetic data, so absolute risk levels are illustrative. Before real use it must be retrained and validated on actual repayment history.</p>
  </div></div></div>
</section>

<!-- ======================= TUTORIALS ======================= -->
<section class="view" data-view="tutorials" aria-label="Tutorial videos">
  <div class="page-head"><div class="grow"><h1 class="display-m">Tutorial videos</h1>
    <p>Watch the full guide, or open one topic to see a short video and a written explanation of that feature.</p></div></div>
  <div class="tut-root" id="tutRoot"></div>
</section>

<!-- ======================= ABOUT ======================= -->
<section class="view" data-view="about" aria-label="About this project">
  <div class="page-head"><div class="grow"><h1 class="display-m">About this project</h1></div></div>
  <div class="grid12">
    <div class="panel" style="grid-column:span 7;padding:28px">
      <dl class="dl" style="font-size:15px;gap:14px 28px">
        <dt>Project</dt><dd>Saakh: AI-based loan eligibility and risk assessment system</dd>
        <dt>Course</dt><dd>AI for Finance, CIA-2</dd>
        <dt>Topic</dt><dd>4. AI-based loan eligibility and risk assessment</dd>
        <dt>Student</dt><dd>Nithin Kumar U</dd>
        <dt>USN</dt><dd>2102508611</dd>
        <dt>Built with</dt><dd>Antigravity (planning, orchestration, browser testing) and Claude Code (implementation and tests)</dd>
        <dt>AI in the product</dt><dd>XGBoost risk model, SHAP explanations, counterfactual advice</dd>
        <dt>Stack</dt><dd>Next.js, Tailwind, shadcn/ui, Motion, FastAPI, scikit-learn, XGBoost, SHAP</dd>
      </dl>
      <div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">
        <button class="btn btn-primary ih" id="aboutTour"><i data-icon="play" data-a="pop"></i><span class="lbl">Start guided demo</span></button>
      </div>
    </div>
    <div class="panel" style="grid-column:span 5;padding:28px">
      <h2 class="subtitle" style="margin-bottom:12px">Practical uses</h2>
      <ul style="margin:0;padding-left:18px;color:var(--ink-2);line-height:26px">
        <li>Banks and NBFCs screening personal, home and auto loan applications</li>
        <li>Loan officers explaining a decision to an applicant</li>
        <li>Applicants checking eligibility and what to improve before applying</li>
        <li>Risk teams watching portfolio quality and expected loss</li>
      </ul>
    </div>
  </div>
</section>

<!-- ======================= LOGIN / REGISTER ======================= -->
<section class="view" data-view="login" aria-label="Sign in">
  <header class="land-top">
    <a class="brand" href="#home" style="padding:0"><span class="brand-mark" data-icon="stamp" data-s="16"></span><span class="brand-name">Saakh</span></a>
    <span class="grow"></span>
    <a class="btn btn-ghost btn-sm" href="#home">Back to home</a>
    <button class="iconbtn ih" data-theme-toggle aria-label="Switch theme"><i data-icon="sun-moon" data-a="spin"></i></button>
  </header>
  <div class="auth-wrap">
    <div class="panel auth-card">
      <div>
        <h1 class="display-m" id="authTitle" style="font-size:36px;line-height:42px">Sign in</h1>
        <p id="authSub" style="margin:8px 0 0;color:var(--ink-2)">Sign in to run assessments and keep your history.</p>
      </div>
      <div class="seg" id="authSeg" data-seg="authmode" style="justify-self:start"><span class="seg-ind"></span><button type="button" data-v="login" aria-pressed="true">Sign in</button><button type="button" data-v="register">Create account</button></div>
      <form id="authForm" novalidate style="display:grid;gap:16px">
        <div class="field" id="fa_name_f" hidden><label for="fa_name">Full name</label><input class="ctl" id="fa_name" autocomplete="name" maxlength="80"></div>
        <div class="field"><label for="fa_email">Email</label><input class="ctl" id="fa_email" type="email" autocomplete="email" inputmode="email" maxlength="254"></div>
        <div class="field"><label for="fa_pw">Password</label><input class="ctl" id="fa_pw" type="password" autocomplete="current-password" maxlength="128"><span class="help" id="fa_pw_help"></span></div>
        <div class="formerr" id="authErr" role="alert" aria-live="polite"></div>
        <button class="btn btn-primary" type="submit" id="authSubmit"><span class="lbl">Sign in</span></button>
      </form>
      <p class="small" style="margin:0">By continuing you agree that Saakh is a demonstration system trained on synthetic data. Decisions shown are illustrative.</p>
    </div>
  </div>
</section>

<!-- ======================= PROFILE ======================= -->
<section class="view" data-view="profile" aria-label="Your profile">
  <div class="page-head"><div class="grow"><h1 class="display-m">Your profile</h1><p id="profSub">Manage your details and account security.</p></div></div>
  <form class="panel prof-card" id="profForm" novalidate>
    <h2 class="subtitle" style="margin-bottom:16px">Personal details</h2>
    <div class="prof-grid">
      <div class="field"><label for="pf_name">Full name</label><input class="ctl" id="pf_name" autocomplete="name" maxlength="80"></div>
      <div class="field"><label for="pf_email">Email</label><input class="ctl" id="pf_email" disabled><span class="help">Your sign-in email cannot be changed.</span></div>
      <div class="field"><label for="pf_phone">Mobile number</label><input class="ctl" id="pf_phone" autocomplete="tel" inputmode="tel" maxlength="15" placeholder="98765 43210"></div>
      <div class="field"><label for="pf_city">City</label><input class="ctl" id="pf_city" autocomplete="address-level2" maxlength="60"></div>
      <div class="field"><label for="pf_emp">Employment</label><select class="ctl" id="pf_emp"><option value="">Not specified</option><option value="salaried">Salaried</option><option value="self_employed">Self-employed</option><option value="business_owner">Business owner</option></select></div>
      <div class="field"><label for="pf_inc">Monthly income (INR)</label><input class="ctl" id="pf_inc" inputmode="numeric" maxlength="9"></div>
    </div>
    <div class="formerr" id="profErr" role="alert" aria-live="polite" style="margin-top:12px"></div>
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap"><button class="btn btn-primary" type="submit" id="profSave"><span class="lbl">Save profile</span></button><a class="btn btn-secondary" href="#assess">Start an assessment</a></div>
  </form>
  <form class="panel prof-card" id="pwForm" novalidate>
    <h2 class="subtitle" style="margin-bottom:16px">Change password</h2>
    <div class="prof-grid">
      <div class="field"><label for="pw_cur">Current password</label><input class="ctl" id="pw_cur" type="password" autocomplete="current-password" maxlength="128"></div>
      <div class="field"><label for="pw_new">New password</label><input class="ctl" id="pw_new" type="password" autocomplete="new-password" maxlength="128"><span class="help">At least 8 characters with a letter and a number.</span></div>
    </div>
    <div class="formerr" id="pwErr" role="alert" aria-live="polite" style="margin-top:12px"></div>
    <div style="margin-top:20px"><button class="btn btn-secondary" type="submit" id="pwSave"><span class="lbl">Update password</span></button></div>
  </form>
  <div class="panel prof-card">
    <h2 class="subtitle" style="margin-bottom:6px">Session and account</h2>
    <p class="small" id="profSince" style="margin:0 0 16px"></p>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-secondary" type="button" id="profSignOut"><span class="lbl">Sign out</span></button><button class="btn btn-ghost" type="button" id="profDelete" style="color:var(--decline)"><span class="lbl">Delete my account</span></button></div>
  </div>
</section>

    </main>
  </div>
</div>

<nav class="tabbar" aria-label="Main navigation">
  <a href="#assess" data-route="assess" class="ih"><i data-icon="file-check" data-a="draw"></i>Assess</a>
  <a href="#what-if" data-route="what-if" class="ih"><i data-icon="sliders-horizontal" data-a="nudge-x"></i>What-if</a>
  <a href="#applicants" data-route="applicants" class="ih"><i data-icon="users" data-a="pop"></i>Applicants</a>
  <a href="#portfolio" data-route="portfolio" class="ih"><i data-icon="chart-column-increasing" data-a="bars"></i>Portfolio</a>
  <button type="button" id="moreBtn" class="ih"><i data-icon="menu" data-a="pop"></i>More</button>
</nav>

<div class="scrim" id="scrim"></div>
<div class="dialog sheet cmd" id="cmd" role="dialog" aria-modal="true" aria-label="Command palette">
  <label class="sr" for="cmdIn">Type a command</label><input class="ctl" id="cmdIn" placeholder="Go to a page or run a command" autocomplete="off">
  <ul id="cmdList" role="listbox"></ul>
</div>
<div class="spot" id="spot"></div>
<div class="tour sheet" id="tour" role="dialog" aria-label="Guided demo"><h4 id="tourT"></h4><p id="tourP"></p><div class="row"><span class="grow" id="tourN"></span><button class="btn btn-ghost btn-sm" id="tourEnd">End</button><button class="btn btn-primary btn-sm" id="tourNext">Next</button></div></div>
<div class="toasts" id="toasts" aria-live="polite"></div>
`;
