import { useState, useEffect } from 'react';

const VANCOUVER_FACTS = [
    { text: "Vancouverism is an internationally recognized urban planning model combining high-density living with view corridors." },
    { text: "Vancouver was the first major Canadian city to declare a climate emergency." },
    { text: "Vancouver protects 27 distinct 'view corridors' to ensure the North Shore mountains remain visible from downtown." },
    { text: "Vancouver implemented North America's first Empty Homes Tax to return underutilized properties to the rental market." },
    { text: "The Vancouver Convention Centre is the world's first double LEED Platinum certified convention centre." },
    { text: "Vancouver's Southeast False Creek Neighbourhood Energy Utility recovers waste heat from sewage to heat the Olympic Village." },
    { text: "Vancouver was designated a City of Reconciliation in 2014, formalizing its commitment to First Nations relations." },
    { text: "Vancouver is governed by the 'Vancouver Charter', granting it unique legislative powers distinct from other BC municipalities." },
    { text: "Vancouver was the first city in Canada to ban polystyrene foam cups and containers." },
    { text: "Vancouver's Arbutus Greenway transformed a former railway corridor into a 9km linear civic park." },
    { text: "Vancouver's building bylaws were among the first to require EV charging infrastructure in all new residential parking spots." },
    { text: "Vancouver's Greenest City Action Plan successfully reduced carbon emissions per person by over 20% since 2007." },
    { text: "Vancouver opened North America's first legal supervised injection site (InSite), pioneering harm reduction policy." },
    { text: "Vancouver aims to be zero waste by 2040 through aggressive composting and circular economy strategies." },
    { text: "Vancouver has over 450 kilometers of bike lanes, making it one of the most bike-friendly cities in North America." },
    { text: "Vancouver's 'Rain City Strategy' uses green infrastructure like rain gardens to manage 90% of rainfall naturally." },
    { text: "Vancouver's Olympic Village is one of the greenest neighbourhoods in the world, achieving LEED Platinum for Neighbourhood Development." },
    { text: "Vancouver's water comes from three protected alpine reservoirs within the North Shore mountains." },
    { text: "Vancouver successfully protected the Agricultural Land Reserve to ensure local food security." },
    { text: "Vancouver was the first city in the world to run a 100% automated driverless transit system (SkyTrain)." },
    { text: "Vancouver plans to remove the Dunsmuir and Georgia Viaducts to reconnect historic Hogan's Alley and Chinatown." },
    { text: "Vancouver's public library (Central Branch) was designed to resemble the Roman Colosseum." },
    { text: "Vancouver mandates that all new rezoning applications must contribute to public art." },
    { text: "Vancouver has the lowest per capita carbon footprint of any major city in North America." },
    { text: "Vancouver has planted over 150,000 new trees since 2010 to grow the urban canopy." },
    { text: "Vancouver's zero emissions building plan requires all new buildings to be zero emissions by 2030." },
    { text: "Vancouver's Burrard Bridge active transportation upgrade reallocated vehicle lanes to dedicated bike and pedestrian paths." },
    { text: "Vancouver successfully transformed Granville Island from industrial land into a civic arts and culture district." },
    { text: "Vancouver's 'EcoDensity' charter was a pioneering policy to increase density to reduce environmental impact." },
    { text: "Vancouver has banned the disposal of organic waste in landfills, mandating composting for all residents and businesses." },
    { text: "Vancouver is home to the world's longest uninterrupted waterfront path, The Seawall, measuring 28km." },
    { text: "Vancouver introduced a ban on plastic straws and shopping bags to reduce single-use plastics." },
    { text: "Vancouver's Broadway Subway Project is the largest civic infrastructure investment in the region's history." },
    { text: "Vancouver maintains over 240 public parks, ensuring 99% of residents live within a 10-minute walk of a park." },
    { text: "Vancouver was the historic birthplace of Greenpeace, launching the global environmental movement." },
    { text: "Vancouver's digital strategy aims to make open data accessible to all citizens for transparency." },
    { text: "Vancouver has set a goal to have 100% of its energy come from renewable sources by 2050." },
    { text: "Vancouver's inclusionary zoning policies require 20% of units in major new developments to be social housing." },
    { text: "Vancouver restored the historic Gastown district, designating it a National Historic Site." },
    { text: "Vancouver built the first seismically isolated school in Canada (Begbie Elementary)." },
    { text: "Vancouver's '311' service allows citizens to report non-emergency civic issues ranging from potholes to graffiti." },
    { text: "Vancouver has one of the highest rates of transit ridership per capita in North America." },
    { text: "Vancouver's Neighbourhood Small Grants program funds citizens to lead small-scale community projects." },
    { text: "Vancouver was the first Canadian city to implement a cigarette recycling program." },
    { text: "Vancouver's 9-1-1 service includes 'E-Comm', a groundbreaking consolidated emergency communications centre." },
    { text: "Vancouver's urban forest strategy aims to increase canopy cover to 22% by 2050." },
    { text: "Vancouver was one of the first cities to adopt a 'living wage' policy for its direct employees." },
    { text: "Vancouver's Seaside Greenway is the longest continuous urban bike path in North America." },
    { text: "Vancouver's PNE (Pacific National Exhibition) has been a civic tradition since 1910." },
    { text: "Vancouver's fire boats provide critical emergency response for its busy harbor and waterfront properties." },
    { text: "Vancouver uses a unique 'deconstruction' bylaw requiring old homes to be recycled rather than demolished." },
    { text: "Vancouver's heavy urban search and rescue team (CAN-TF1) responds to disasters globally." },
    { text: "Vancouver has the largest fleet of electric buses in Canada." },
    { text: "Vancouver's False Creek was industrially polluted but rehabilitated into a thriving residential waterfront." },
    { text: "Vancouver's Heritage Conservation Program protects over 2,200 historic buildings." },
    { text: "Vancouver limits building heights to preserve views of the North Shore mountains." },
    { text: "Vancouver's 'Shared Streets' pilot turns roadways into pedestrian-first public plazas." },
    { text: "Vancouver was the first city in Canada to regulate short-term rentals to protect long-term housing stock." },
    { text: "Vancouver's Trout Lake is a peat bog that was transformed into a beloved community park." },
    { text: "Vancouver's zero-waste strategy includes a 'reuse and repair' directory for residents." },
    { text: "Vancouver's collision-free goal (Vision Zero) aims to eliminate traffic fatalities." },
    { text: "Vancouver's noise control bylaw was one of the first to address urban noise pollution comprehensively." },
    { text: "Vancouver's drinking water is treated with UV disinfection to ensure safety without heavy chlorination." },
    { text: "Vancouver's Community Energy Plans help neighbourhoods transition to renewable energy sources." },
    { text: "Vancouver's public art program includes the 'Trans Am Totem', a sculpture made of scrap cars." },
    { text: "Vancouver has a civic poet laureate program to promote literature and local storytelling." },
    { text: "Vancouver's Hastings Park is being restored to daylight a buried stream." },
    { text: "Vancouver's tactical urbanism projects include 'pavement-to-parks' plazas." },
    { text: "Vancouver's affordable housing agency (VAHA) develops housing on city-owned land." },
    { text: "Vancouver's Crosstown bike route connects the east and west sides of the city safely." },
    { text: "Vancouver's civic theatres (Orpheum, Queen Elizabeth) remain publicly owned cultural assets." },
    { text: "Vancouver's engineering department pioneered the use of warm-mix asphalt to reduce paving emissions." },
    { text: "Vancouver's street cleaning crews collect thousands of tonnes of leaves annually for composting." },
    { text: "Vancouver's Laneway Housing program promotes gentle density in single-family neighbourhoods." },
    { text: "Vancouver's mural festival transforms blank walls into public art galleries." },
    { text: "Vancouver's traffic signal timing is optimized for pedestrians and cyclists in many areas." },
    { text: "Vancouver's invasive species strategy protects native biodiversity in civic parks." },
    { text: "Vancouver's emergency management office prepares the city for 'The Big One' (earthquake)." },
    { text: "Vancouver's snow removal plan prioritizes bus routes and emergency corridors." },
    { text: "Vancouver's civic archives hold records dating back to the city's incorporation in 1886." }
];

export default function FunFacts() {
    const [factIndex, setFactIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        setFactIndex(Math.floor(Math.random() * VANCOUVER_FACTS.length));

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setFactIndex((prev) => (prev + 1) % VANCOUVER_FACTS.length);
                setFade(true);
            }, 300); // Wait for fade out
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const currentFact = VANCOUVER_FACTS[factIndex];

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
            <div className="relative">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-400 rounded-full animate-spin"></div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800">
                    Crunching the Minutes...
                </h3>
                <p className="text-gray-500 text-sm mt-1">Reading through council documents</p>
            </div>

            <div className="w-full bg-blue-50/50 rounded-xl border border-blue-200/60 p-4 pt-3.5 shadow-sm">
                <div className="text-base font-semibold text-blue-600/80 mb-2 uppercase tracking-wider text-center">
                    Did you know?
                </div>

                <div className={`transition-opacity duration-300 flex flex-col items-center ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                        "{currentFact.text}"
                    </p>
                </div>
            </div>
        </div>
    );
}
