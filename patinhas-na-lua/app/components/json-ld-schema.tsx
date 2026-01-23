export default function JsonLdSchema() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://patinhasnalua.com",
    "name": "Patinhas na Lua",
    "description": "Serviços de Grooming, Banhos, Tosquias e Spa para cães e gatos em Castelo Branco. Produtos naturais e atendimento personalizado.",
    "url": "https://patinhasnalua.com",
    "logo": "https://patinhasnalua.com/logo.png",
    "image": "https://patinhasnalua.com/logo.png",
    "telephone": "+351925378741",
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "R. Dra. Maria de Fátima Delgado Domingos Farinha Lote 237 Loja 3",
      "postalCode": "6000-410",
      "addressLocality": "Castelo Branco",
      "addressRegion": "Castelo Branco",
      "addressCountry": "PT"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "39.8227",
      "longitude": "-7.4931"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.instagram.com/patinhasnalua",
      "https://www.facebook.com/patinhasnalua"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Serviços de Grooming",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Banho e Tosquia",
            "description": "Banho completo com tosquia higiénica ou estética"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Spa e Tratamentos",
            "description": "Tratamentos de hidratação e máscaras capilares"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Grooming ao Domicílio",
            "description": "Serviço de grooming móvel com carrinha equipada"
          }
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
}
