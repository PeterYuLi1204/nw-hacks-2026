import { useState, useEffect } from 'react';

const GLOBAL_FACTS = [
    { icon: "🗳️", text: "The world's first known democracy was established in Athens around 508 BC." },
    { icon: "🏙️", text: "Tokyo is the world's most populous city with over 37 million residents." },
    { icon: "🌍", text: "There are over 10,000 smart cities being developed globally right now." },
    { icon: "🚲", text: "Copenhagen is considered the most bike-friendly city in the world." },
    { icon: "🌳", text: "Singapore aims to cover 50% of its land area with greenery by 2030." },
    { icon: "💡", text: "The first streetlights were introduced in London in 1417 (they were candle lanterns!)." },
    { icon: "🚇", text: "The Shanghai Metro is the world's longest subway system by route length." },
    { icon: "🏘️", text: "Vienna has been voted the world's most livable city multiple times." },
    { icon: "📱", text: "Over 54% of the world's population now lives in urban areas." },
    { icon: "🏛️", text: "The oldest continuously inhabited city in the world is Damascus, Syria." },
    { icon: "🗼", text: "Paris has a secret underground city of catacombs holding 6 million people." },
    { icon: "🌉", text: "Istanbul is the only city in the world located on two continents (Europe and Asia)." },
    { icon: "🏜️", text: "Dubai's Burj Khalifa is so tall you can watch the sunset twice in one day." },
    { icon: "🌊", text: "Venice rests on 118 islands separated by 150 canals." },
    { icon: "🌋", text: "Reykjavik runs almost entirely on geothermal power." },
    { icon: "🏰", text: "Prague is home to the largest ancient castle in the world." },
    { icon: "🎭", text: "New York City has over 800 languages spoken, making it the most linguistically diverse city." },
    { icon: "⛰️", text: "La Paz, Bolivia is the highest administrative capital in the world." },
    { icon: "🚢", text: "The Port of Rotterdam was the world's busiest port for 42 years." },
    { icon: "🌸", text: "Kyoto has over 1600 Buddhist temples and 400 Shinto shrines." },
    { icon: "🦁", text: "Nairobi is the only capital city with a national park bordering it." },
    { icon: "🍫", text: "Brussels is known as the chocolate capital of the world." },
    { icon: "🕰️", text: "The Great Bell in London's Elizabeth Tower is nicknamed Big Ben." },
    { icon: "🌵", text: "Phoenix, Arizona gets over 300 days of sunshine a year." },
    { icon: "🚋", text: "Melbourne has the largest tram network in the world." },
    { icon: "🖼️", text: "St. Petersburg's Hermitage Museum has over 3 million items of art." },
    { icon: "🏔️", text: "Informatics was pioneered in Manchester with the first stored-program computer." },
    { icon: "🌮", text: "Mexico City sinks about 10 inches every year." },
    { icon: "♻️", text: "San Francisco was the first US city to ban plastic bags." },
    { icon: "📡", text: "Tallinn, Estonia offers free public transport to all residents." },
    { icon: "🔌", text: "Oslo became the first capital to divest from fossil fuels." },
    { icon: "📚", text: "The Library of Congress in DC is the largest library in the world." },
    { icon: "🚦", text: "Traffic lights were used before cars were invented (for horse carriages in London)." },
    { icon: "🧱", text: "The Great Wall of China is the longest man-made structure in the world." },
    { icon: "⛲", text: "Rome has over 2,000 fountains, more than any other city." },
    { icon: "🎿", text: "Salt Lake City is the only US capital to have hosted the Winter Olympics." },
    { icon: "🍁", text: "Montreal is the second-largest French-speaking city in the world after Paris." },
    { icon: "🏗️", text: "Chicago is the birthplace of the modern skyscraper." },
    { icon: "🛶", text: "Bangkok was once known as the 'Venice of the East' due to its canals." },
    { icon: "🐫", text: "Pyramids of Giza are the only surviving ancient wonder of the world." },
    { icon: "🏰", text: "Edinburgh Castle sits on top of an extinct volcano." },
    { icon: "🚌", text: "Curitiba, Brazil pioneered the Bus Rapid Transit (BRT) system used globally." },
    { icon: "☕", text: "Seattle is home to the very first Starbucks, opened in 1971." },
    { icon: "🥶", text: "Ulaanbaatar, Mongolia is the coldest capital city in the world." },
    { icon: "🥪", text: "The sandwich was invented in London by the Earl of Sandwich." },
    { icon: "🔭", text: "Los Angeles has more museums per capita than any other city in the world." },
    { icon: "🕊️", text: "Geneva is home to the European headquarters of the United Nations." },
    { icon: "🎆", text: "Sydney's New Year's Eve fireworks are watched by over 1 billion people globally." },
    { icon: "🛣️", text: "The Pan-American Highway is the world's longest motorable road." },
    { icon: "🕌", text: "The Blue Mosque in Istanbul has six minarets." },
    { icon: "🐉", text: "Hong Kong has more skyscrapers than any other city in the world." },
    { icon: "🏝️", text: "Stockholm is built on 14 islands connected by 57 bridges." },
    { icon: "🥐", text: "The croissant actually originated in Vienna, Austria, not France." },
    { icon: "⛪", text: "Barcelona's Sagrada Familia has been under construction since 1882." },
    { icon: "🤠", text: "Austin, Texas is known as the Live Music Capital of the World." },
    { icon: "🍀", text: "Boston built the first subway system in the United States in 1897." },
    { icon: "🏔️", text: "Denver is exactly one mile high above sea level." },
    { icon: "🏖️", text: "Miami is the only major US city founded by a woman (Julia Tuttle)." },
    { icon: "🍷", text: "Bordeaux produces over 700 million bottles of wine every year." },
    { icon: "🤖", text: "Seoul has the world's fastest average internet speeds." },
    { icon: "🐘", text: "New Delhi housed the world's largest bird statue." },
    { icon: "🚲", text: "Amsterdam has more bicycles than people." },
    { icon: "🎨", text: "Florence is considered the birthplace of the Renaissance." },
    { icon: "🦁", text: "Johannesburg is the largest city in the world not located on a river, lake, or coastline." },
    { icon: "🎭", text: "Mumbai produces more films annually than Hollywood (Bollywood)." },
    { icon: "💧", text: "Cape Town was the first major city to face 'Day Zero' water crisis planning." },
    { icon: "🚂", text: "The Trans-Siberian Railway is the longest railway line in the world." },
    { icon: "🏙️", text: "Manila is the most densely populated city proper in the world." },
    { icon: "🗿", text: "Easter Island is one of the most remote inhabited islands in the world." },
    { icon: "🏰", text: "Heidelberg University is the oldest university in Germany." },
    { icon: "🧬", text: "Cambridge is known as 'Silicon Fen' due to its high-tech cluster." },
    { icon: "🚢", text: "Panama City controls the entrance to the Panama Canal." },
    { icon: "🌉", text: "San Francisco's Golden Gate Bridge was originally going to be black and yellow." },
    { icon: "🎭", text: "Las Vegas has more hotel rooms than any other city on earth." },
    { icon: "🦖", text: "Drumheller, Canada is the dinosaur capital of the world." },
    { icon: "🌲", text: "Portland, Oregon is home to the world's smallest park (Mill Ends Park)." },
    { icon: "🦅", text: "Washington D.C. has no skyscrapers due to the Height of Buildings Act." },
    { icon: "🥘", text: "Valencia is the birthplace of the famous Spanish dish Paella." },
    { icon: "🔭", text: "The Vatican City is the smallest country in the world." },
    { icon: "🍫", text: "Zurich is home to one of the biggest chocolate museums." },
    { icon: "🏰", text: "Lisbon is older than Rome, Paris, and London." },
    { icon: "🌋", text: "Naples is located near Mount Vesuvius, the only active volcano on mainland Europe." },
    { icon: "🍺", text: "Munich hosts Oktoberfest, the world's largest beer festival." },
    { icon: "🏰", text: "Copenhagen's Tivoli Gardens inspired Walt Disney to create Disneyland." },
    { icon: "🕍", text: "Jerusalem is considered holy to three major Abrahamic religions." },
    { icon: "🏞️", text: "Banff National Park is Canada's oldest national park." }
];

export default function FunFacts() {
    const [factIndex, setFactIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        setFactIndex(Math.floor(Math.random() * GLOBAL_FACTS.length));

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setFactIndex((prev) => (prev + 1) % GLOBAL_FACTS.length);
                setFade(true);
            }, 300); // Wait for fade out
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const currentFact = GLOBAL_FACTS[factIndex];

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
            <div className="relative">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-400 rounded-full animate-spin"></div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800">
                    Analyzing Minutes...
                </h3>
                <p className="text-gray-500 text-sm mt-1">Reading through council documents</p>
            </div>

            <div className="w-full bg-blue-50/50 rounded-xl border border-blue-200/60 p-5 shadow-sm">
                <div className="text-xs font-semibold text-blue-600/80 mb-3 uppercase tracking-wider text-center">
                    Did you know?
                </div>

                <div className={`transition-opacity duration-300 flex flex-col items-center gap-3 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-gray-700 font-medium leading-relaxed">
                        "{currentFact.text}"
                    </p>
                </div>
            </div>
        </div>
    );
}
