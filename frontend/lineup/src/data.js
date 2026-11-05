// Sample figures for the mockup. In production these come from the Launch Library
// launcher-config endpoint (length, diameter, leo_capacity, gto_capacity, to_thrust, launch_mass).
// null = "Not published".
// paint: colours used for the procedural 3D model (body, boosters, accent/fins, engine).
export const ROCKETS = [
  { id: 'starship', name: 'Starship', provider: 'SpaceX', height: 121, diameter: 9, leo: 100000, gto: null, thrust: 74400, mass: 5000,
    stages: 2, boosters: 0, firstFlight: 2023, reusable: 'Fully reusable (planned)' },
  { id: 'sls', name: 'SLS Block 1', provider: 'NASA', height: 98, diameter: 8.4, leo: 95000, gto: null, thrust: 39144, mass: 2610,
    stages: 2, boosters: 2, firstFlight: 2022, reusable: 'Expendable' },
  { id: 'newglenn', name: 'New Glenn', provider: 'Blue Origin', height: 98, diameter: 7, leo: 45000, gto: 13600, thrust: 17100, mass: 1633,
    stages: 2, boosters: 0, firstFlight: 2025, reusable: 'Reusable first stage' },
  { id: 'falcon9', name: 'Falcon 9', provider: 'SpaceX', height: 70, diameter: 3.7, leo: 22800, gto: 8300, thrust: 7607, mass: 549,
    stages: 2, boosters: 0, firstFlight: 2010, reusable: 'Reusable first stage' },
  { id: 'falconheavy', name: 'Falcon Heavy', provider: 'SpaceX', height: 70, diameter: 3.7, leo: 63800, gto: 26700, thrust: 22819, mass: 1420,
    stages: 2, boosters: 2, firstFlight: 2018, reusable: 'Reusable side boosters and core' },
  { id: 'ariane6', name: 'Ariane 64', provider: 'Arianespace', height: 63, diameter: 5.4, leo: 21650, gto: 11500, thrust: 15400, mass: 860,
    stages: 2, boosters: 4, firstFlight: 2024, reusable: 'Expendable' },
  { id: 'vulcan', name: 'Vulcan', provider: 'ULA', height: 61.6, diameter: 5.4, leo: 27200, gto: 15300, thrust: 10500, mass: 546,
    stages: 2, boosters: 6, firstFlight: 2024, reusable: 'Expendable' },
  { id: 'atlasv', name: 'Atlas V 551', provider: 'ULA', height: 58.3, diameter: 3.8, leo: 18850, gto: 8900, thrust: 12250, mass: 568,
    stages: 2, boosters: 5, firstFlight: 2006, reusable: 'Expendable' },
  { id: 'longmarch5', name: 'Long March 5', provider: 'CASC', height: 57, diameter: 5, leo: 25000, gto: 14000, thrust: 10565, mass: 869,
    stages: 2, boosters: 4, firstFlight: 2016, reusable: 'Expendable' },
  { id: 'soyuz', name: 'Soyuz 2.1b', provider: 'Roscosmos', height: 46.3, diameter: 2.95, leo: 8200, gto: 3250, thrust: 4146, mass: 312,
    stages: 3, boosters: 4, firstFlight: 2006, reusable: 'Expendable' },
  { id: 'vegac', name: 'Vega C', provider: 'Arianespace', height: 35, diameter: 3.4, leo: 3300, gto: null, thrust: 4500, mass: 210,
    stages: 4, boosters: 0, firstFlight: 2022, reusable: 'Expendable' },
  { id: 'kuaizhou', name: 'Kuaizhou 1A', provider: 'ExPace', height: 20, diameter: 1.4, leo: 400, gto: null, thrust: null, mass: 30,
    stages: 4, boosters: 0, firstFlight: 2017, reusable: 'Expendable' },
  { id: 'electron', name: 'Electron', provider: 'Rocket Lab', height: 18, diameter: 1.2, leo: 300, gto: null, thrust: 224, mass: 13,
    stages: 2, boosters: 0, firstFlight: 2017, reusable: 'Partially reusable (in testing)' },
];

// Rockets flying in the window with no published height (shown as a dashed "?" slot).
export const NO_HEIGHT = [{ id: 'ceres2', name: 'Ceres-2', provider: 'Galactic Energy' }];

// The rocket whose page this module sits on.
export const FEATURED = 'falcon9';
