import React, { useState, useRef, useEffect } from 'react'
import OutputBox from '../components/OutputBox'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import ErrorToast from '../components/ErrorToast'
import { useAuth } from '../context/AuthContext'

function DownDropdown({ value, onChange, options, placeholder, active }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o === value)

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 36px 8px 12px', borderRadius: 8, textAlign: 'left',
          border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
          background: 'var(--surface)', color: selected ? 'var(--text-1)' : 'var(--text-3)',
          fontSize: '0.875rem', fontFamily: 'var(--font)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--text-3)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 9999, background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
          maxHeight: 240, overflowY: 'auto', padding: '4px 0', margin: 0,
          listStyle: 'none',
        }}>
          {options.map((opt, i) => (
            <li
              key={i}
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              style={{
                padding: '8px 14px', cursor: 'pointer', fontSize: '0.875rem',
                color: opt === value ? 'var(--accent)' : 'var(--text-1)',
                background: opt === value ? 'var(--accent-soft)' : 'transparent',
                fontWeight: opt === value ? 600 : 400,
              }}
              onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = opt === value ? 'var(--accent-soft)' : 'transparent' }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin

const TOPIC_SUGGESTIONS = {
  'Math': {
    'Kindergarten': ['Counting 1–10','Counting 11–20','Basic Shapes (Circle, Square, Triangle)','Comparing Numbers (More & Less)','Patterns (AB, AAB)','Sorting by Color and Shape','Introduction to Addition','Introduction to Subtraction','Positional Words (Above, Below, Next To)','Measurement: Tall vs Short'],
    'Grade 1': ['Addition within 20','Subtraction within 20','Number Patterns','Skip Counting by 2s, 5s, 10s','Introduction to Place Value','Measurement: Length','2D and 3D Shapes','Telling Time to the Hour','Introduction to Fractions (Halves, Quarters)','Graphing & Data'],
    'Grade 2': ['2-Digit Addition with Regrouping','2-Digit Subtraction with Regrouping','Place Value to 1000','Introduction to Multiplication','Basic Division Concepts','Money: Coins and Bills','Measurement: Ruler and Scale','Fractions: Halves, Thirds, Fourths','Geometry: Lines and Angles','Even and Odd Numbers'],
    'Grade 3': ['Multiplication Tables (1–10)','Division Basics','Fractions: Numerator & Denominator','Equivalent Fractions','Area and Perimeter','Telling Time to the Minute','Rounding Numbers','Multi-Step Word Problems','Introduction to Graphs','Basic Geometry Concepts'],
    'Grade 4': ['Long Multiplication','Long Division','Decimals: Tenths & Hundredths','Adding and Subtracting Fractions','Multiplying Fractions','Area & Perimeter of Rectangles','Angles and Lines','Factors and Multiples','Order of Operations (PEMDAS)','Data: Mean, Median, Mode'],
    'Grade 5': ['Fractions: All Operations','Decimals: All Operations','Order of Operations','Introduction to Algebra (Variables)','Ratios and Rates','Volume of 3D Shapes','Coordinate Planes','Prime and Composite Numbers','Percentages Basics','Data and Statistics'],
    'Grade 6': ['Ratios and Proportions','Integers (Positive & Negative)','Algebraic Expressions','Solving One-Step Equations','Area of Triangles and Quadrilaterals','Introduction to Statistics','Fractions, Decimals & Percentages','Greatest Common Factor & LCM','Graphing on a Coordinate Plane','Introduction to Probability'],
    'Grade 7': ['Linear Equations','Proportional Relationships','Percentages and Discounts','Inequalities','Geometric Transformations','Surface Area and Volume','Statistics: Sampling','Introduction to Probability','Properties of Triangles','Rational Numbers'],
    'Grade 8': ['Systems of Equations','Quadratic Expressions','Pythagorean Theorem','Functions and Relations','Exponents and Scientific Notation','Transformations in Geometry','Statistics: Scatter Plots','Slope and Linear Functions','Irrational Numbers','Factoring Polynomials'],
    'Grade 9': ['Quadratic Equations','Polynomials','Graphing Linear Equations','Systems of Equations','Introduction to Trigonometry','Probability','Sequences and Series','Exponential Functions','Geometry: Circles and Angles','Statistics and Data Analysis'],
    'Grade 10': ['Trigonometry: Sin, Cos, Tan','Probability & Combinations','Logarithms','Conic Sections','Quadratic Functions','Geometric Proofs','Statistics: Normal Distribution','Sequences & Series','Complex Numbers','Matrix Basics'],
    'Grade 11': ['Introduction to Calculus (Limits)','Derivatives','Logarithmic and Exponential Functions','Polynomial Functions','Trigonometric Identities','Vectors','Introduction to Statistics (AP)','Permutations and Combinations','Matrices and Determinants','Rational Functions'],
    'Grade 12': ['Integrals and Integration','Differential Equations','Advanced Statistics','Calculus Applications','Multivariable Functions','Probability Distributions','Series and Convergence','Complex Numbers and Polar Form','Linear Algebra','Mathematical Modeling'],
  },
  'Science': {
    'Kindergarten': ['Living and Non-Living Things','Plants Around Us','Animals and Their Homes','Weather and Seasons','My Five Senses','Day and Night','Caring for the Earth','Water: Liquid and Ice','Basic Body Parts','Sun, Moon, and Stars'],
    'Grade 1': ['Animal Habitats','Seasons and Weather Changes','Plant Life Cycle','The Five Senses','Pushes and Pulls (Force)','Sun and Moon Patterns','Rocks and Soil','Sound and Vibrations','Light and Shadows','Living Things Need Air, Water, Food'],
    'Grade 2': ['Life Cycles of Plants and Animals','Solids, Liquids, and Gases','Earth Materials (Rocks, Soil, Water)','Fossils and the Past','Weather Patterns','Properties of Matter','Ecosystems: Who Eats Whom','Air and Wind','Animal Adaptations','Natural vs Man-Made Materials'],
    'Grade 3': ['Food Chains and Food Webs','Magnetism and Electricity','Weather and Climate','Ecosystems and Biomes','Inheritance: Traits from Parents','Fossils and Extinction','Forces: Gravity and Friction','Earth\'s Resources','Life Cycles','Light and Sound Energy'],
    'Grade 4': ['Ecosystems and Energy Flow','Static Electricity','Rocks and the Rock Cycle','Plate Tectonics','Animal Adaptations and Survival','Sound Waves','Plant and Animal Cells (intro)','Water Cycle','Natural Disasters','Simple Machines'],
    'Grade 5': ['Photosynthesis','The Solar System and Beyond','Matter: Properties and Changes','Ecosystems and Human Impact','Food Webs and Energy','Gravity and Orbital Motion','Physical vs Chemical Changes','Mixtures and Solutions','Adaptations and Evolution (intro)','Earth\'s Layers'],
    'Grade 6': ['Cell Structure and Function','Earth\'s Layers and Plate Tectonics','Force, Motion, and Newton\'s Laws','Weather Systems','Ecosystems and Biomes','Introduction to Chemistry','Energy Types and Transformation','The Water Cycle','Volcanoes and Earthquakes','Introduction to Genetics'],
    'Grade 7': ['Human Body Systems','Chemical Reactions','Genetics and Heredity','Evolution and Natural Selection','Waves: Light and Sound','The Periodic Table (intro)','Ecosystems and Biodiversity','Earth\'s Atmosphere','Cell Division: Mitosis','Astronomy: Stars and Galaxies'],
    'Grade 8': ['Genetics and DNA','Newton\'s Laws of Motion','Waves and Sound','Electricity and Circuits','Chemical Bonding (intro)','Natural Selection and Adaptation','Earth\'s History and Fossils','Acids and Bases','Energy Conservation','Human Impact on the Environment'],
    'Grade 9': ['Atomic Structure','Natural Selection and Evolution','Types of Energy','Introduction to Ecology','Chemical Reactions','DNA Structure and Replication','Motion, Speed, and Velocity','Biomes and Ecosystems','Periodic Table and Elements','Introduction to Thermodynamics'],
    'Grade 10': ['Photosynthesis and Cellular Respiration','Plate Tectonics and Earthquakes','Acids, Bases, and pH','Genetics: Mendel\'s Laws','Chemical Bonding','Newton\'s Laws and Motion','Ecosystems and Human Impact','Waves: Light, Sound, Electromagnetic','Periodic Trends','Evolution: Evidence and Mechanisms'],
    'Grade 11': ['Organic Chemistry','Advanced Genetics and DNA','Thermodynamics','Quantum Theory (intro)','Ecology and Environmental Issues','Human Physiology','Reaction Rates and Equilibrium','Nuclear Chemistry (intro)','Animal Behavior','Biotechnology'],
    'Grade 12': ['Quantum Physics','Biotechnology and Genetic Engineering','Environmental Science and Policy','Advanced Cellular Biology','Nuclear Reactions','Astrophysics','Biochemistry','Climate Change: Causes and Effects','Advanced Ecology','Neuroscience Basics'],
  },
  'English Language Arts': {
    'Kindergarten': ['Alphabet: Letters A–Z','Phonics: Beginning Sounds','Rhyming Words','Sight Words (Dolch List)','Story Sequencing','Characters and Setting','Print Concepts (Book Handling)','Retelling a Story','Listening and Speaking Skills','Writing Letters and Names'],
    'Grade 1': ['Short Vowel Sounds','Blending Sounds to Read','Reading Comprehension: Main Idea','Sentence Writing','Nouns and Verbs','Story Elements: Beginning, Middle, End','Question Words (Who, What, Where)','Capitalization and Punctuation','Retelling Stories','Rhyming and Word Families'],
    'Grade 2': ['Long Vowel Patterns','Nouns, Verbs, and Adjectives','Main Idea and Supporting Details','Story Elements: Problem and Solution','Writing Complete Sentences','Compound Words and Contractions','Introduction to Paragraphs','Author\'s Purpose','Making Predictions','Compare and Contrast'],
    'Grade 3': ['Adjectives and Adverbs','Paragraph Writing','Point of View (First & Third Person)','Figurative Language: Simile and Metaphor','Reading: Cause and Effect','Grammar: Subject and Predicate','Story Theme','Research Writing Basics','Summarizing a Text','Synonyms and Antonyms'],
    'Grade 4': ['Figurative Language: Idioms, Similes, Metaphors','Essay Structure: Introduction and Conclusion','Summarizing Non-Fiction Texts','Grammar: Tenses (Past, Present, Future)','Theme and Main Idea','Text Features (Headings, Charts, Captions)','Vocabulary in Context','Creative Writing: Short Stories','Informational Writing','Reading: Making Inferences'],
    'Grade 5': ['Theme and Character Development','Persuasive Writing','Vocabulary Strategies (Roots, Prefixes, Suffixes)','Author\'s Purpose and Perspective','Literary Devices: Foreshadowing, Flashback','Research and Note-Taking','Opinion Writing','Point of View in Literature','Text Structures in Non-Fiction','Compare and Contrast Two Texts'],
    'Grade 6': ['Literary Devices: Symbolism, Irony, Imagery','Argumentative Writing','Text Structure in Non-Fiction','Character Analysis','Introduction to Research Papers','Reading: Theme vs Main Idea','Grammar: Complex Sentences','Citing Evidence from Text','Narrative Writing','Poetry: Figurative Language and Structure'],
    'Grade 7': ['Character Motivation and Development','Narrative Writing Techniques','Making Inferences and Drawing Conclusions','Argumentative Essay Writing','Analyzing Poetry','Rhetorical Devices','Reading Non-Fiction: Author\'s Bias','Word Choice and Tone','Theme Across Multiple Texts','Grammar: Clauses and Phrases'],
    'Grade 8': ['Using Textual Evidence','Research Paper Writing','Rhetorical Devices: Ethos, Pathos, Logos','Literary Analysis Essay','Reading Shakespeare (Introduction)','Compare and Contrast Themes','Grammar: Advanced Punctuation','Analyzing Informational Texts','Narrative Techniques in Fiction','Debate and Argument Structure'],
    'Grade 9': ['Literary Analysis: Plot, Theme, Conflict','Expository Writing','Introduction to Shakespeare (Romeo and Juliet)','Rhetorical Analysis','Analyzing Poetry: Form and Meaning','Grammar: Sentence Variety','Research: Evaluating Sources','Vocabulary: Latin and Greek Roots','Character vs Society Conflicts','Introduction to Satire'],
    'Grade 10': ['Poetry Analysis: Modernist and Classical','Comparative Essay Writing','Rhetoric and Persuasion','Advanced Shakespeare','Analyzing World Literature','Satire and Social Commentary','Grammar: Style and Voice','Literary Movements Overview','Non-Fiction: Speeches and Memoirs','Research and Citation (MLA Format)'],
    'Grade 11': ['American Literature Overview','Synthesis Essay Writing','AP Style Rhetorical Analysis','Transcendentalism','Modernism in Literature','The Harlem Renaissance','Advanced Grammar and Style','Analyzing Argumentative Non-Fiction','Literary Criticism Approaches','Research: Annotated Bibliography'],
    'Grade 12': ['World Literature and Global Themes','College Essay Writing','Critical Analysis of Classic Texts','Post-Modern Literature','Existentialism in Literature','Advanced Argumentative Writing','Literary Theory Basics','Analyzing Complex Non-Fiction','Synthesis and Evaluation of Sources','Shakespeare: Tragedy and Comedy'],
  },
  'History': {
    'Grade 3': ['My Community\'s History','Native American Cultures','Colonial Life in America','Famous American Leaders','Symbols of the United States','Maps and Early Settlements','Life Long Ago vs Today','Thanksgiving: Historical Context','American Heroes','Introduction to Government'],
    'Grade 4': ['State History and Government','American Revolution: Causes','American Revolution: Key Events','Westward Expansion','Native American Removal','The Constitution and Bill of Rights','Early American Economy','Lewis and Clark Expedition','Slavery and the Underground Railroad','Immigration to America'],
    'Grade 5': ['The Civil War: Causes','Civil War: Key Battles and Leaders','Reconstruction Era','The Industrial Revolution','Immigration: Ellis Island','Women\'s Suffrage Movement','World War I Overview','The Great Depression','World War II Overview','Civil Rights Movement Beginnings'],
    'Grade 6': ['Ancient Egypt: Civilization and Culture','Ancient Greece: Democracy and Philosophy','Ancient Rome: Republic and Empire','Ancient China: Dynasties and Inventions','Ancient India: Hinduism and Buddhism','Mesopotamia: The First Civilizations','Ancient Africa: Kingdoms and Trade','The Silk Road','Ancient Israel and Early Monotheism','The Fall of the Roman Empire'],
    'Grade 7': ['The Middle Ages: Feudalism','The Crusades','The Black Death and Its Impact','The Renaissance: Art and Ideas','The Protestant Reformation','Age of Exploration: Columbus and Magellan','The Aztec and Inca Empires','The Trans-Atlantic Slave Trade','The Ottoman Empire','The Scientific Revolution'],
    'Grade 8': ['The American Revolution: Deep Dive','The Constitution and Federalism','The Civil War: Causes and Consequences','Reconstruction: Successes and Failures','Westward Expansion and Manifest Destiny','Immigration and Industrialization','Spanish-American War','The Progressive Era','World War I and US Involvement','The Roaring Twenties'],
    'Grade 9': ['World War I: Causes and Alliances','The Russian Revolution','The Great Depression: Global Impact','The Rise of Fascism and Nazism','World War II: European Theater','World War II: Pacific Theater','The Holocaust','The Cold War Begins','Colonialism and Its Legacy','The United Nations and International Order'],
    'Grade 10': ['World War II: Causes and Consequences','The Cold War: US vs USSR','Korean War','Vietnam War','Decolonization in Africa and Asia','The Civil Rights Movement in the US','The Space Race','Cuban Missile Crisis','The Fall of the Soviet Union','Globalization in the 20th Century'],
    'Grade 11': ['US History: Reconstruction to WWI','The New Deal','World War II: American Perspective','The Civil Rights Movement','The Vietnam War Era','Watergate and Presidential Power','Reagan Era and the Cold War End','Immigration in American History','Women\'s Rights Movement','Modern US Foreign Policy'],
    'Grade 12': ['Modern World History Overview','Genocide: Holocaust, Rwanda, Cambodia','Israeli-Palestinian Conflict','The Arab Spring','Rise of China as a Global Power','Climate Change as a Historical Issue','Post-9/11 World','Economic Globalization','Human Rights in the Modern Era','History of Democracy and Authoritarianism'],
  },
  'Geography': {
    'Grade 3': ['Maps and Map Skills','Continents and Oceans','Landforms: Mountains, Rivers, Plains','My Community\'s Geography','Cardinal Directions','Natural Resources in My State','Urban, Suburban, and Rural Areas','Weather and Climate Basics','Countries and Capitals','How People Use Land'],
    'Grade 4': ['US Regions: Northeast, South, Midwest, West','Climate Zones of the US','Natural Disasters in the US','Rivers and Lakes of America','National Parks','Population Distribution','Agriculture Across America','Energy Resources','State Capitals and Borders','Human Impact on Nature'],
    'Grade 5': ['World Regions Overview','Human and Physical Geography','Migration: Why People Move','World Religions and Culture','Amazon Rainforest','Arctic and Antarctic','Trade and Economics','Water Scarcity Around the World','World Climates','Major Mountain Ranges'],
    'Grade 6': ['Latitude, Longitude, and Grid Systems','World Biomes','World Population and Demographics','Plate Tectonics and Landforms','Climate Change: Geographic Impact','Africa: Physical Geography','Asia: Physical Geography','River Systems of the World','Urbanization Trends','Geographic Tools (GIS, Maps)'],
    'Grade 7': ['World Cultures and Cultural Regions','Rivers and Mountains of the World','Trade Routes: Ancient and Modern','Middle East: Geography and Culture','Southeast Asia: Physical and Human Geography','Europe: Geography and Culture','Latin America: Physical Geography','Ocean Currents and Climate','Population Growth Issues','Natural Resource Distribution'],
    'Grade 8': ['US Geographic Regions','Economic Geography of the US','Political Maps and Borders','US National Parks and Conservation','Water Systems in North America','Urban Geography: City Growth','Immigration Patterns in the US','Agricultural Regions of America','Geographic Factors in History','Transportation and Geography'],
    'Grade 9': ['Physical Geography: Landforms and Processes','Urbanization and Mega-Cities','Environmental Issues: Deforestation','Water Resources and Conflicts','Geographic Factors and Development','Climate Zones and Vegetation','Plate Tectonics Deep Dive','Human Migration Patterns','Borders and Political Geography','Geographic Technology (GIS, GPS)'],
    'Grade 10': ['Human Geography: Culture and Identity','Globalization and Its Effects','Cultural Landscapes','Population Policies (China, India)','Economic Development Models','Environmental Geography','Geopolitics: Power and Territory','Cultural Diffusion and Acculturation','Urban Planning and Smart Cities','Food Security and Agriculture'],
    'Grade 11': ['AP Human Geography: Population','AP Human Geography: Culture','AP Human Geography: Political Organization','AP Human Geography: Agriculture','AP Human Geography: Industrialization','AP Human Geography: Cities','Development and Inequality','Environmental Sustainability','Geopolitical Conflicts','Migration and Refugee Crisis'],
    'Grade 12': ['Economic Geography: Global Trade','Environmental Policy and Geography','World Systems Theory','Geographic Perspectives on Poverty','Climate Change: Regional Impacts','Water Wars and Future Conflicts','Megacities of the Future','Resource Geopolitics (Oil, Water)','Food Systems and Geography','Geopolitics of the Arctic'],
  },
  'Biology': {
    'Grade 6': ['Cell Structure and Function','Prokaryotic vs Eukaryotic Cells','Ecosystems and Food Webs','Photosynthesis Basics','Plant Classification','Fungi and Bacteria','Animal Kingdom Overview','Introduction to Genetics','Biomes of the World','Human Body: Digestive System'],
    'Grade 7': ['Human Body: Skeletal and Muscular Systems','Human Body: Circulatory System','Human Body: Respiratory System','Genetics: Dominant and Recessive Traits','Cell Division: Mitosis','Microbiology: Viruses and Bacteria','Ecosystems and Biodiversity','Classification of Living Things','Evolution Introduction','Nutrition and Health'],
    'Grade 8': ['Evolution and Natural Selection','DNA Structure and Function','Cell Division: Mitosis and Meiosis','Heredity and Punnett Squares','Ecology: Populations and Communities','Adaptations and Survival','Viruses, Bacteria, and Disease','Food Chains and Energy Transfer','Biomes and Climate','Human Impact on Biodiversity'],
    'Grade 9': ['Cell Division and Cancer','Natural Selection Evidence','Biomes and Ecosystems','Cellular Respiration','DNA Replication','Classification System (Taxonomy)','Human Immune System','Population Ecology','Animal Behavior','Introduction to Evolution'],
    'Grade 10': ['Photosynthesis: Light and Dark Reactions','Cellular Respiration: Detailed','Genetics: Mendelian and Beyond','Gene Expression','Classification of Life: 6 Kingdoms','Ecological Relationships','Biodiversity and Conservation','Human Reproductive System','Plant Biology: Structure and Function','Evolutionary Evidence'],
    'Grade 11': ['Molecular Biology: DNA and RNA','Protein Synthesis (Transcription & Translation)','Animal Behavior and Ethology','Human Physiology: Nervous System','Human Physiology: Endocrine System','Immune System: Innate and Adaptive','Ecology: Advanced Concepts','Population Genetics','Evolutionary Biology','Biotechnology: PCR and Gel Electrophoresis'],
    'Grade 12': ['Biotechnology and Genetic Engineering','CRISPR and Gene Editing','Advanced Genetics and Epigenetics','Neurobiology','Cancer Biology','Environmental Biology','Advanced Ecology','Evolutionary Mechanisms','Stem Cells and Regenerative Medicine','Bioinformatics'],
  },
  'Chemistry': {
    'Grade 9': ['Atomic Structure: Protons, Neutrons, Electrons','Introduction to the Periodic Table','Chemical vs Physical Changes','States of Matter','Introduction to Chemical Bonding','Mixtures and Pure Substances','Balancing Chemical Equations (intro)','Acids and Bases Introduction','The Mole Concept (intro)','Lab Safety and Scientific Method'],
    'Grade 10': ['Chemical Reactions: Types and Examples','Balancing Chemical Equations','Acids, Bases, and pH Scale','Stoichiometry','Ionic and Covalent Bonds','Thermochemistry: Endothermic and Exothermic','Gas Laws (Boyle\'s, Charles\')','Solutions and Concentration','Oxidation and Reduction','Periodic Trends'],
    'Grade 11': ['Organic Chemistry: Hydrocarbons','Functional Groups','Chemical Equilibrium and Le Chatelier\'s Principle','Thermochemistry: Enthalpy and Entropy','Reaction Rates and Kinetics','Electrochemistry: Galvanic Cells','Quantum Model of the Atom','Advanced Acids and Bases','Polymers and Plastics','Nuclear Chemistry Introduction'],
    'Grade 12': ['Advanced Organic Chemistry','Electrochemistry: Electrolysis','Nuclear Fission and Fusion','Advanced Thermodynamics','Complex Reaction Mechanisms','Spectroscopy and Molecular Structure','Green Chemistry','Industrial Chemistry','Biochemistry: Enzymes and Metabolism','Environmental Chemistry'],
  },
  'Physics': {
    'Grade 9': ['Motion: Distance, Speed, Velocity','Acceleration and Newton\'s First Law','Newton\'s Second Law (F=ma)','Newton\'s Third Law','Types of Energy: KE and PE','Work and Power','Simple Machines','Waves: Frequency and Amplitude','Sound Waves','Introduction to Electricity'],
    'Grade 10': ['Waves and Sound Properties','Electricity: Current, Voltage, Resistance','Magnetic Fields','Light: Reflection and Refraction','Optics: Lenses and Mirrors','Circular Motion','Momentum and Impulse','Energy Conservation','Introduction to Thermodynamics','Nuclear Energy'],
    'Grade 11': ['Thermodynamics: Laws and Applications','Optics: Advanced','Circular and Rotational Motion','Gravitational Fields','Electric Fields and Potential','Electromagnetic Induction','Simple Harmonic Motion','Fluid Dynamics','Wave Interference and Diffraction','Nuclear Physics'],
    'Grade 12': ['Quantum Mechanics','Special Relativity: E=mc²','Nuclear Fission and Fusion','Particle Physics','Astrophysics: Stars and Galaxies','Advanced Electromagnetism','Quantum Numbers and Electron Configuration','Superconductivity','String Theory (Overview)','Physics of the Universe'],
  },
  'Social Studies': {
    'Kindergarten': ['My Family and Community','Rules and Why We Have Them','Needs vs Wants','Helpers in My Community','Holidays and Celebrations','Maps: My Neighborhood','Sharing and Caring','Then and Now','Being a Good Citizen','Different Families, Same Values'],
    'Grade 1': ['Community Workers and Their Roles','Government: Local and National','Patriotic Symbols','How Laws Help Us','Goods and Services','Historical Figures: MLK, Harriet Tubman','Landforms and Bodies of Water','Cultures Around the World','Introduction to Economics','Rights and Responsibilities'],
    'Grade 2': ['Famous Americans and Their Contributions','Comparing Communities','Producers and Consumers','Natural Resources and Conservation','Introduction to World Cultures','Map Skills: Physical and Political Maps','Holidays Around the World','Government: Roles of Leaders','Transportation Then and Now','Culture and Traditions'],
    'Grade 3': ['Local Government','Culture and Diversity','Supply and Demand','Regions of the United States','American Symbols and Monuments','Early American Settlers','Economic Choices','Landforms and Natural Resources','Citizenship and Civic Responsibility','Immigration Stories'],
    'Grade 4': ['State Government Structure','Native American Cultures','Westward Expansion','US Economy Overview','The Constitution Basics','Cultural Diversity in the US','Geographic Regions of America','Environmental Issues','Famous Explorers','American Revolution Introduction'],
    'Grade 5': ['Three Branches of Government','The Civil War Causes and Effects','Immigration and Diversity','American Economy: Supply and Demand','Bill of Rights','Reconstruction Era','Industrial Revolution Effects','Women\'s Rights Movement','World War I and II Overview','Civic Participation'],
  },
  'Computer Science': {
    'Grade 3': ['Basic Computer Parts and Functions','Introduction to Coding with Scratch','Internet Safety Rules','Binary Numbers Introduction','Algorithms: Step-by-Step Instructions','What is a Program?','Keyboard and Mouse Skills','Digital Citizenship','Introduction to Loops and Patterns','Problem Solving with Computers'],
    'Grade 5': ['Scratch Programming Projects','Algorithms and Flowcharts','Binary Numbers','Introduction to HTML','Variables in Programming','Conditionals: If-Then-Else','Loops in Code','What is the Internet?','Cybersecurity Basics','Data and How Computers Store It'],
    'Grade 7': ['Python Basics: Variables and Data Types','Python: Loops and Conditionals','Web Design: HTML and CSS','Introduction to Databases','Algorithms: Searching and Sorting','Networks and How the Internet Works','Cybersecurity Threats','Introduction to Computational Thinking','Boolean Logic','Data Representation: Binary and Hexadecimal'],
    'Grade 9': ['Programming Logic and Control Flow','Data Structures: Lists and Arrays','Introduction to Object-Oriented Programming','Functions and Recursion','Cybersecurity: Threats and Defenses','Networking and Protocols','Database Design Basics','Algorithms: Big O Notation','Web Development: JavaScript','Ethics in Computing'],
    'Grade 11': ['Object-Oriented Programming: Classes and Objects','Artificial Intelligence: Introduction','Machine Learning Basics','Data Science: Working with Data','Software Development Lifecycle','Advanced Data Structures: Trees, Graphs','Computer Architecture','Cybersecurity: Encryption','API Design and Usage','Ethics of AI and Technology'],
    'Grade 12': ['Advanced Algorithms and Complexity','Computer Networks: Deep Dive','Mobile App Development','Cloud Computing','Artificial Intelligence: Deep Learning','Software Engineering Principles','Data Science Capstone','Cybersecurity: Ethical Hacking','Blockchain Technology','Career Paths in Computer Science'],
  },
  'Art': {
    'Kindergarten': ['Primary Colors','Basic Shapes in Art','Drawing Faces','Finger Painting','Making Patterns'],
    'Grade 3': ['Color Mixing: Primary and Secondary','Drawing from Observation','Introduction to Sculpture','Famous Artists: Picasso, Matisse','Symmetry in Art'],
    'Grade 6': ['Perspective Drawing: 1-Point','Color Theory: Warm and Cool Colors','Abstract Art Movement','Printmaking Techniques','Art Elements: Line, Shape, Form, Color'],
    'Grade 9': ['Art History: Renaissance to Modern','Realistic Drawing Techniques','Photography as Art','Digital Art Basics','Art Critique and Analysis'],
    'Grade 12': ['Contemporary Art Movements','Portfolio Development','Advanced Painting Techniques','Art and Society','Mixed Media Projects'],
  },
  'Music': {
    'Kindergarten': ['Rhythm and Beat','High and Low Sounds','Fast and Slow Music','Singing Simple Songs','Musical Instruments'],
    'Grade 3': ['Reading Music: Notes and Rests','Rhythm Patterns','Introduction to Recorder','Major and Minor Keys','Famous Composers: Bach, Beethoven'],
    'Grade 6': ['Music Theory: Scales and Chords','Reading Sheet Music','World Music Cultures','Introduction to Songwriting','Music and Emotion'],
    'Grade 9': ['Music Theory: Harmony and Melody','Music History: Baroque to Jazz','Composition Basics','Digital Music Production','Analysis of Musical Genres'],
    'Grade 12': ['Advanced Music Theory','Music History: 20th Century to Present','AP Music Theory','Composition and Arrangement','Music Technology and Industry'],
  },
  'Physical Education': {
    'Kindergarten': ['Basic Movement Skills','Throwing and Catching','Kicking a Ball','Running and Jumping','Team vs Individual Activities'],
    'Grade 3': ['Team Sports: Soccer Basics','Fitness: Cardiovascular Exercise','Jumping Rope Skills','Sportsmanship and Fair Play','Flexibility and Stretching'],
    'Grade 6': ['Health-Related Fitness','Basketball Fundamentals','Volleyball Basics','Goal Setting in PE','Nutrition and Exercise'],
    'Grade 9': ['Fitness Planning','Weight Training Basics','Aerobic Fitness','Sports Injuries and Prevention','Lifetime Sports: Tennis, Swimming'],
    'Grade 12': ['Personal Fitness Program Design','Stress Management and Exercise','Sports Psychology','Community and Recreational Activities','Health and Wellness Lifestyle'],
  },
  'Foreign Language': {
    'Kindergarten': ['Greetings in Spanish/French','Numbers 1–10','Colors','Animals','Family Members'],
    'Grade 3': ['Days and Months','Classroom Objects','Food and Drinks','Simple Sentences','Cultural Traditions'],
    'Grade 6': ['Present Tense Verbs','Describing People and Places','Shopping and Money','Telling Time','Cultural Festivals'],
    'Grade 9': ['Past Tense Narration','Subjunctive Mood Introduction','Travel and Tourism Vocabulary','Literature in Target Language','Cultural Comparisons'],
    'Grade 12': ['Advanced Grammar Review','Literature Analysis in Target Language','Debate and Persuasion','Cultural Identity','AP Language Exam Preparation'],
  },
  'Health': {
    'Kindergarten': ['Washing Hands and Hygiene','Healthy Foods','Exercise and Sleep','Feelings and Emotions','Staying Safe'],
    'Grade 3': ['Nutrition: Food Groups','Exercise and the Body','Germs and Disease Prevention','Mental Health: Managing Feelings','Safety: Road and Home'],
    'Grade 6': ['Puberty and Body Changes','Mental Health and Stress','Nutrition and Healthy Choices','Drug and Alcohol Prevention','Online Safety and Cyberbullying'],
    'Grade 9': ['Mental Health: Anxiety and Depression','Sexual Health Education','Substance Abuse Prevention','Nutrition and Fitness','First Aid and CPR'],
    'Grade 12': ['College and Career Wellness','Relationships and Consent','Chronic Disease Prevention','Community Health Issues','Health Advocacy and Literacy'],
  },
  'default': [
    'Introduction to the Topic','Key Concepts and Vocabulary','Historical Background','Real-World Applications',
    'Critical Thinking and Analysis','Comparison and Contrast','Problem Solving','Review and Practice',
    'Case Study','Current Events Related to the Topic','Debate: Multiple Perspectives','Project-Based Learning',
  ],
}

function getTopics(subject, grade) {
  const subjectMap = TOPIC_SUGGESTIONS[subject]
  if (!subjectMap) return TOPIC_SUGGESTIONS['default']
  return subjectMap[grade] || TOPIC_SUGGESTIONS['default']
}

const GRADES = [
  'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
]

const SUBJECTS = [
  'Math','Science','English Language Arts','History','Geography',
  'Physics','Chemistry','Biology','Social Studies','Art','Music',
  'Physical Education','Computer Science','Foreign Language','Health',
]

const WORKSHEET_TYPES = [
  { value: 'mixed',           label: 'Mixed' },
  { value: 'fill_blank',      label: 'Fill in the Blank' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'qa',              label: 'Q & A' },
  { value: 'open_ended',      label: 'Open Ended' },
]

const MC_FORMATS = [
  { value: 'pure_mc',      label: 'Pure MC' },
  { value: 'mc_truefalse', label: 'MC + True/False' },
  { value: 'mc_short',     label: 'MC + Short Answer' },
]


export default function AutoGenerator() {
  const { teacherId: TEACHER_ID } = useAuth()
  const STUDENT_ID = 'student-' + (Math.random().toString(36).substring(7))
  const [form, setForm] = useState({
    grade_level: '',
    subject: '',
    topic: '',
    worksheet_type: 'mixed',
    mc_format: 'pure_mc',
    num_questions: 10,
  })
  const [customTopic, setCustomTopic] = useState('')
  const [topicSource, setTopicSource] = useState('dropdown') // 'dropdown' | 'custom'
  const [results, setResults] = useState({ worksheet: '', lesson_plan: '', mc_assessment: '', quiz: '' })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('lesson_plan')
  const [showHistory, setShowHistory] = useState(false)
  const [limitError, setLimitError] = useState('')
  const [errors, setErrors] = useState({})
  const [timeTaken, setTimeTaken] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const usageCounterRef = useRef(null)
  const [sourceMaterial, setSourceMaterial] = useState('')
  const [materialName, setMaterialName]     = useState('')
  const [materialUploading, setMaterialUploading] = useState(false)
  const materialFileRef = useRef(null)

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setMaterialUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`${API}/api/upload-material`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      setSourceMaterial(data.text); setMaterialName(file.name)
    } catch (e) { alert('Could not read file: ' + e.message) }
    finally { setMaterialUploading(false); e.target.value = '' }
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setListening(true)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setCustomTopic(transcript)
      setTopicSource('custom')
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const set = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: val,
      ...(key === 'grade_level' || key === 'subject' ? { topic: '' } : {}),
    }))
    if (key === 'grade_level' || key === 'subject') {
      setCustomTopic('')
      setTopicSource('dropdown')
    }
    setErrors(e => ({ ...e, [key]: '', topic: '' }))
  }

  const activeTopic = topicSource === 'custom' ? customTopic : form.topic

  const validate = () => {
    const e = {}
    if (!form.grade_level) e.grade_level = 'Select a grade level'
    if (!form.subject)     e.subject     = 'Select a subject'
    if (!activeTopic.trim()) e.topic = 'Please select from the list or type your own topic'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const generate = async () => {
    if (!validate()) return
    setLoading(true)
    setResults({ worksheet: '', lesson_plan: '', mc_assessment: '', quiz: '' })
    setTimeTaken(null)
    const start = Date.now()

    // Check usage limit first
    try {
      const usageRes = await fetch(`${API}/api/increment-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'auto-generate' })
      })
      const usageData = await usageRes.json()

      if (usageData.exceeded) {
        setLimitError(usageData.error || 'Daily limit exceeded. Try again tomorrow.')
        setLoading(false)
        return
      }
    } catch (e) {
      console.error('Usage check failed:', e)
      // Continue anyway if usage check fails
    }

    try {
      // Run auto-generate and quiz generation in parallel
      const [res, quizRes] = await Promise.all([
        fetch(`${API}/api/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, topic: activeTopic, source_material: sourceMaterial }),
        }),
        fetch(`${API}/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: activeTopic,
            grade_level: form.grade_level,
            subject: form.subject,
            num_questions: Math.min(form.num_questions, 10),
            difficulty: 'medium',
          }),
        }),
      ])
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Generation failed')

      // Format quiz JSON as readable text for OutputBox
      let quizText = ''
      try {
        if (quizRes.ok) {
          const quizData = await quizRes.json()
          quizText = `# ${quizData.title}\n`
          quizText += `Grade: ${form.grade_level} | Subject: ${form.subject} | Difficulty: medium\n\n`
          quizData.questions?.forEach((q, i) => {
            quizText += `${i + 1}. ${q.question}\n`
            q.options?.forEach((opt, j) => {
              const letter = ['A','B','C','D'][j]
              quizText += `   ${letter}) ${opt.replace(/^[A-D]\)\s*/i, '')}\n`
            })
            quizText += `   **Answer: ${q.correct}**\n   Explanation: ${q.explanation}\n\n`
          })
        }
      } catch {}

      const newResults = {
        worksheet:     data.worksheet,
        lesson_plan:   data.lesson_plan,
        mc_assessment: data.mc_assessment,
        quiz:          quizText,
      }
      setResults(newResults)

      // Refresh usage counter immediately
      if (usageCounterRef.current) {
        usageCounterRef.current.refresh()
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      setTimeTaken(elapsed)
      setActiveTab('lesson_plan')

      // Save to localStorage for Dashboard preview
      const saved = JSON.parse(localStorage.getItem('classroom-auto-history') || '[]')
      saved.unshift({
        id: Date.now(),
        topic: activeTopic,
        grade: form.grade_level,
        subject: form.subject,
        generatedAt: new Date().toLocaleString(),
        timeTaken: elapsed,
        ...newResults,
      })
      localStorage.setItem('classroom-auto-history', JSON.stringify(saved.slice(0, 5)))

      // Save to chat history
      try {
        fetch(`${API}/api/save-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: TEACHER_ID,
            tool_name: 'auto-generate',
            topic: activeTopic,
            grade_level: form.grade_level,
            subject: form.subject,
            request_data: form,
            response_preview: (data.lesson_plan || data.worksheet || data.mc_assessment)?.substring(0, 200) || '',
            response_content: (data.lesson_plan || data.worksheet || data.mc_assessment) || ''
          })
        })
      } catch (e) {
        console.error('Chat save failed:', e)
      }
    } catch (e) {
      setErrors({ general: e.message })
    } finally {
      setLoading(false)
    }
  }

  const hasResults = results.lesson_plan || results.worksheet || results.mc_assessment || results.quiz

  const tabList = [
    { key: 'lesson_plan',   label: 'Lesson Plan',   emoji: '📋' },
    { key: 'worksheet',     label: 'Worksheet',     emoji: '📝' },
    { key: 'mc_assessment', label: 'MC Assessment', emoji: '✅' },
    { key: 'quiz',          label: 'Quiz',          emoji: '🎯' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      {limitError && <ErrorToast message={limitError} duration={5000} onClose={() => setLimitError('')} />}

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <button onClick={() => setShowHistory(true)} title="Chat History" style={{
              background: '#399aff', border: 'none', borderRadius: 8,
              padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: 'white', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s'
            }}>
              📋 History
            </button>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 16px rgba(245,158,11,0.30)',
            }}>⚡</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                Auto Generate — All 4 Tools
                <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="auto-generate" />
              </h1>
              <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14 }}>
                One click · Lesson Plan + Worksheet + MC Assessment + Quiz · Language auto-adjusted by grade
              </p>
            </div>
          </div>
        </div>

      {/* ── Form Card ──────────────────────────────────── */}
      <div className="card fade-up-1" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20 }}>
          Configure Your Materials
        </h2>

        {/* Grade + Subject */}
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Grade Level *</label>
            <select
              className="form-select"
              value={form.grade_level}
              onChange={e => set('grade_level', e.target.value)}
            >
              <option value="">Select grade...</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.grade_level && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.grade_level}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <select
              className="form-select"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
            >
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.subject && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.subject}</span>}
          </div>
        </div>

        {/* Topic */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">
            Topic *
            {form.grade_level && form.subject && (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', marginLeft: 8 }}>
                {getTopics(form.subject, form.grade_level).length} suggestions available
              </span>
            )}
          </label>

          {/* Option A — Dropdown */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select from list
            </div>
            <DownDropdown
              value={topicSource === 'dropdown' ? form.topic : ''}
              onChange={val => { set('topic', val); setCustomTopic(''); setTopicSource('dropdown') }}
              options={getTopics(form.subject, form.grade_level)}
              placeholder={
                form.grade_level && form.subject
                  ? `— Choose a ${form.subject} topic for ${form.grade_level} —`
                  : '— Select grade & subject first —'
              }
              active={topicSource === 'dropdown' && !!form.topic}
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Option B — Manual input */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
              Type or speak your topic
              {listening && (
                <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, animation: 'pulse 1s ease-in-out infinite' }}>
                  ● LISTENING...
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                value={customTopic}
                onChange={e => {
                  setCustomTopic(e.target.value)
                  setTopicSource(e.target.value ? 'custom' : 'dropdown')
                }}
                placeholder={listening ? 'Listening… speak your topic now' : 'e.g. Photosynthesis, The Mughal Empire, Quadratic Equations...'}
                style={{
                  paddingRight: customTopic ? 72 : 42,
                  border: listening
                    ? '1.5px solid #ef4444'
                    : topicSource === 'custom' && customTopic
                      ? '1.5px solid var(--accent)'
                      : '1.5px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}
              />

              {/* Clear button — shown when there's text */}
              {customTopic && (
                <button
                  type="button"
                  onClick={() => { setCustomTopic(''); setTopicSource('dropdown') }}
                  style={{
                    position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', fontSize: 18, lineHeight: 1, padding: 0,
                  }}
                >×</button>
              )}

              {/* Mic button — always shown */}
              <button
                type="button"
                onClick={startVoice}
                title={listening ? 'Stop listening' : 'Click to speak topic'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: listening ? '#ef4444' : 'var(--accent-soft)',
                  border: listening ? '1.5px solid #ef4444' : '1.5px solid var(--accent-mid)',
                  borderRadius: 6, cursor: 'pointer',
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: listening ? '0 0 0 3px rgba(239,68,68,0.25)' : 'none',
                  animation: listening ? 'pulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {listening ? (
                  /* Stop icon (square) when listening */
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                ) : (
                  /* Mic icon when idle */
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Active topic preview */}
          {activeTopic && (
            <div style={{
              marginTop: 10, padding: '7px 12px', borderRadius: 8,
              background: 'var(--accent-soft)', border: '1px solid var(--accent-mid)',
              fontSize: 13, color: 'var(--accent)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✓</span>
              <span>Topic: {activeTopic}</span>
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-2)', marginLeft: 4 }}>
                ({topicSource === 'custom' ? 'custom entry' : 'selected from list'})
              </span>
            </div>
          )}

          {errors.topic && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.topic}</span>
          )}
        </div>

        {/* Worksheet Type */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Worksheet Question Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {WORKSHEET_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => set('worksheet_type', t.value)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: form.worksheet_type === t.value ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: form.worksheet_type === t.value ? 'var(--accent-soft)' : 'var(--surface)',
                  color: form.worksheet_type === t.value ? 'var(--accent)' : 'var(--text-2)',
                }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* MC Format */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">MC Assessment Format</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MC_FORMATS.map(f => (
              <button
                key={f.value}
                onClick={() => set('mc_format', f.value)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: form.mc_format === f.value ? '2px solid #8b5cf6' : '2px solid var(--border)',
                  background: form.mc_format === f.value ? '#f5f3ff' : 'var(--surface)',
                  color: form.mc_format === f.value ? '#8b5cf6' : 'var(--text-2)',
                }}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Questions slider */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">
            Number of Questions — <strong style={{ color: 'var(--accent)' }}>{form.num_questions}</strong>
          </label>
          <input
            type="range" min={3} max={25} value={form.num_questions}
            onChange={e => set('num_questions', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
            <span>3</span><span>25</span>
          </div>
        </div>

        {/* Upload Teaching Material */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Upload Your Material (optional)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={materialUploading} onClick={() => materialFileRef.current?.click()}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,
                border:'1.5px solid var(--accent-mid)',background:'var(--accent-soft)',
                color:'var(--accent)',fontSize:'0.82rem',fontWeight:600,cursor:'pointer' }}>
              {materialUploading ? '⏳ Reading…' : '📄 Upload PDF / DOCX / TXT'}
            </button>
            {sourceMaterial && <span style={{ fontSize:'0.78rem',color:'#10b981',fontWeight:600 }}>✓ {materialName}</span>}
            {sourceMaterial && <button type="button" onClick={() => { setSourceMaterial(''); setMaterialName('') }}
              style={{ fontSize:'0.75rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}>✕ Remove</button>}
          </div>
          <input ref={materialFileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display:'none' }} onChange={handleMaterialUpload} />
          {sourceMaterial && <div style={{ fontSize:'0.72rem',color:'var(--text-3)',marginTop:4 }}>All 3 tools will be based on your uploaded material</div>}
        </div>

        {errors.general && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16,
          }}>
            {errors.general}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
            background: loading ? 'var(--text-3)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Generating all 4 tools...</>
            : <>⚡ Generate All 4 Tools at Once</>
          }
        </button>
      </div>

      {/* ── Loading indicator ──────────────────────────── */}
      {loading && (
        <div className="card fade-up" style={{ marginBottom: 24, textAlign: 'center', padding: '32px 24px' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 6 }}>
            Generating your materials...
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Creating Lesson Plan, Worksheet, MC Assessment &amp; Quiz for {activeTopic || form.topic}
          </div>
        </div>
      )}

      {/* ── Output Tabs ────────────────────────────────── */}
      {hasResults && (
        <div className="fade-up">
          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tabList.map(tab => {
              const ready = !!results[tab.key]
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
                    border: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: activeTab === tab.key ? 'var(--accent)' : 'var(--surface)',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-2)',
                    boxShadow: activeTab === tab.key ? 'var(--shadow)' : 'none',
                  }}
                >
                  {tab.emoji} {tab.label}
                  {ready && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
                      background: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : '#dcfce7',
                      color: activeTab === tab.key ? '#fff' : '#15803d',
                    }}>
                      Ready ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Output */}
          {results[activeTab] && (
            <OutputBox
              key={activeTab}
              result={results[activeTab]}
              onClear={() => setResults(r => ({ ...r, [activeTab]: '' }))}
            />
          )}
        </div>
      )}

      </div>

      {/* Chat History Sidebar */}
      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        teacherId={TEACHER_ID}
        onSelectChat={(chat) => {
          // Show the full chat content
          setResults({
            worksheet: chat.content || chat.preview || '',
            lesson_plan: chat.content || chat.preview || '',
            mc_assessment: chat.content || chat.preview || ''
          })
          setShowHistory(false)
        }}
      />
    </div>
  )
}
