const countries = [
    { code: 'AFG', name: 'Afghanistan', flag: '🇦🇫' },
    { code: 'ALB', name: 'Albania', flag: '🇦🇱' },
    { code: 'DZA', name: 'Algeria', flag: '🇩🇿' },
    { code: 'AND', name: 'Andorra', flag: '🇦🇩' },
    { code: 'AGO', name: 'Angola', flag: '🇦🇴' },
    { code: 'ATG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
    { code: 'ARM', name: 'Armenia', flag: '🇦🇲' },
    { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
    { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
    { code: 'AZE', name: 'Azerbaijan', flag: '🇦🇿' },
    { code: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
    { code: 'BHR', name: 'Bahrain', flag: '🇧🇭' },
    { code: 'BGD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'BRB', name: 'Barbados', flag: '🇧🇧' },
    { code: 'BLR', name: 'Belarus', flag: '🇧🇾' },
    { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
    { code: 'BLZ', name: 'Belize', flag: '🇧🇿' },
    { code: 'BEN', name: 'Benin', flag: '🇧🇯' },
    { code: 'BTN', name: 'Bhutan', flag: '🇧🇹' },
    { code: 'BOL', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'BIH', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: 'BWA', name: 'Botswana', flag: '🇧🇼' },
    { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
    { code: 'BRN', name: 'Brunei', flag: '🇧🇳' },
    { code: 'BGR', name: 'Bulgaria', flag: '🇧🇬' },
    { code: 'BFA', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'BDI', name: 'Burundi', flag: '🇧🇮' },
    { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻' },
    { code: 'KHM', name: 'Cambodia', flag: '🇰🇭' },
    { code: 'CMR', name: 'Cameroon', flag: '🇨🇲' },
    { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
    { code: 'CAF', name: 'Central African Republic', flag: '🇨🇫' },
    { code: 'TCD', name: 'Chad', flag: '🇹🇩' },
    { code: 'CHL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CHN', name: 'China', flag: '🇨🇳' },
    { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
    { code: 'COM', name: 'Comoros', flag: '🇰🇲' },
    { code: 'COG', name: 'Congo (Brazzaville)', flag: '🇨🇬' },
    { code: 'COD', name: 'Congo (Kinshasa)', flag: '🇨🇩' },
    { code: 'CRI', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'CIV', name: 'Côte d’Ivoire', flag: '🇨🇮' },
    { code: 'HRV', name: 'Croatia', flag: '🇭🇷' },
    { code: 'CUB', name: 'Cuba', flag: '🇨🇺' },
    { code: 'CYP', name: 'Cyprus', flag: '🇨🇾' },
    { code: 'CZE', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'DNK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'DJI', name: 'Djibouti', flag: '🇩🇯' },
    { code: 'DMA', name: 'Dominica', flag: '🇩🇲' },
    { code: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
    { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'EGY', name: 'Egypt', flag: '🇪🇬' },
    { code: 'SLV', name: 'El Salvador', flag: '🇸🇻' },
    { code: 'GNQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: 'ERI', name: 'Eritrea', flag: '🇪🇷' },
    { code: 'EST', name: 'Estonia', flag: '🇪🇪' },
    { code: 'SWZ', name: 'Eswatini', flag: '🇸🇿' },
    { code: 'ETH', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'FJI', name: 'Fiji', flag: '🇫🇯' },
    { code: 'FIN', name: 'Finland', flag: '🇫🇮' },
    { code: 'FRA', name: 'France', flag: '🇫🇷' },
    { code: 'GAB', name: 'Gabon', flag: '🇬🇦' },
    { code: 'GMB', name: 'Gambia', flag: '🇬🇲' },
    { code: 'GEO', name: 'Georgia', flag: '🇬🇪' },
    { code: 'DEU', name: 'Germany', flag: '🇩🇪' },
    { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
    { code: 'GRC', name: 'Greece', flag: '🇬🇷' },
    { code: 'GRD', name: 'Grenada', flag: '🇬🇩' },
    { code: 'GTM', name: 'Guatemala', flag: '🇬🇹' },
    { code: 'GIN', name: 'Guinea', flag: '🇬🇳' },
    { code: 'GNB', name: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: 'GUY', name: 'Guyana', flag: '🇬🇾' },
    { code: 'HTI', name: 'Haiti', flag: '🇭🇹' },
    { code: 'HND', name: 'Honduras', flag: '🇭🇳' },
    { code: 'HUN', name: 'Hungary', flag: '🇭🇺' },
    { code: 'ISL', name: 'Iceland', flag: '🇮🇸' },
    { code: 'IND', name: 'India', flag: '🇮🇳' },
    { code: 'IDN', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'IRN', name: 'Iran', flag: '🇮🇷' },
    { code: 'IRQ', name: 'Iraq', flag: '🇮🇶' },
    { code: 'IRL', name: 'Ireland', flag: '🇮🇪' },
    { code: 'ISR', name: 'Israel', flag: '🇮🇱' },
    { code: 'ITA', name: 'Italy', flag: '🇮🇹' },
    { code: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
    { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
    { code: 'JOR', name: 'Jordan', flag: '🇯🇴' },
    { code: 'KAZ', name: 'Kazakhstan', flag: '🇰🇿' },
    { code: 'KEN', name: 'Kenya', flag: '🇰🇪' },
    { code: 'KIR', name: 'Kiribati', flag: '🇰🇮' },
    { code: 'KWT', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'KGZ', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: 'LAO', name: 'Laos', flag: '🇱🇦' },
    { code: 'LVA', name: 'Latvia', flag: '🇱🇻' },
    { code: 'LBN', name: 'Lebanon', flag: '🇱🇧' },
    { code: 'LSO', name: 'Lesotho', flag: '🇱🇸' },
    { code: 'LBR', name: 'Liberia', flag: '🇱🇷' },
    { code: 'LBY', name: 'Libya', flag: '🇱🇾' },
    { code: 'LIE', name: 'Liechtenstein', flag: '🇱🇮' },
    { code: 'LTU', name: 'Lithuania', flag: '🇱🇹' },
    { code: 'LUX', name: 'Luxembourg', flag: '🇱🇺' },
    { code: 'MDG', name: 'Madagascar', flag: '🇲🇬' },
    { code: 'MWI', name: 'Malawi', flag: '🇲🇼' },
    { code: 'MYS', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'MDV', name: 'Maldives', flag: '🇲🇻' },
    { code: 'MLI', name: 'Mali', flag: '🇲🇱' },
    { code: 'MLT', name: 'Malta', flag: '🇲🇹' },
    { code: 'MHL', name: 'Marshall Islands', flag: '🇲🇭' },
    { code: 'MRT', name: 'Mauritania', flag: '🇲🇷' },
    { code: 'MUS', name: 'Mauritius', flag: '🇲🇺' },
    { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'FSM', name: 'Micronesia', flag: '🇫🇲' },
    { code: 'MDA', name: 'Moldova', flag: '🇲🇩' },
    { code: 'MCO', name: 'Monaco', flag: '🇲🇨' },
    { code: 'MNG', name: 'Mongolia', flag: '🇲🇳' },
    { code: 'MNE', name: 'Montenegro', flag: '🇲🇪' },
    { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
    { code: 'MOZ', name: 'Mozambique', flag: '🇲🇿' },
    { code: 'MMR', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'NAM', name: 'Namibia', flag: '🇳🇦' },
    { code: 'NRU', name: 'Nauru', flag: '🇳🇷' },
    { code: 'NPL', name: 'Nepal', flag: '🇳🇵' },
    { code: 'NLD', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'NZL', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'NIC', name: 'Nicaragua', flag: '🇳🇮' },
    { code: 'NER', name: 'Niger', flag: '🇳🇪' },
    { code: 'NGA', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'PRK', name: 'North Korea', flag: '🇰🇵' },
    { code: 'MKD', name: 'North Macedonia', flag: '🇲🇰' },
    { code: 'NOR', name: 'Norway', flag: '🇳🇴' },
    { code: 'OMN', name: 'Oman', flag: '🇴🇲' },
    { code: 'PAK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'PLW', name: 'Palau', flag: '🇵🇼' },
    { code: 'PAN', name: 'Panama', flag: '🇵🇦' },
    { code: 'PNG', name: 'Papua New Guinea', flag: '🇵🇬' },
    { code: 'PRY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'PER', name: 'Peru', flag: '🇵🇪' },
    { code: 'PHL', name: 'Philippines', flag: '🇵🇭' },
    { code: 'POL', name: 'Poland', flag: '🇵🇱' },
    { code: 'PRT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'QAT', name: 'Qatar', flag: '🇶🇦' },
    { code: 'ROU', name: 'Romania', flag: '🇷🇴' },
    { code: 'RUS', name: 'Russia', flag: '🇷🇺' },
    { code: 'RWA', name: 'Rwanda', flag: '🇷🇼' },
    { code: 'KNA', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
    { code: 'VCT', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: 'WSM', name: 'Samoa', flag: '🇼🇸' },
    { code: 'SMR', name: 'San Marino', flag: '🇸🇲' },
    { code: 'STP', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
    { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
    { code: 'SRB', name: 'Serbia', flag: '🇷🇸' },
    { code: 'SYC', name: 'Seychelles', flag: '🇸🇨' },
    { code: 'SLE', name: 'Sierra Leone', flag: '🇸🇱' },
    { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
    { code: 'SVK', name: 'Slovakia', flag: '🇸🇰' },
    { code: 'SVN', name: 'Slovenia', flag: '🇸🇮' },
    { code: 'SLB', name: 'Solomon Islands', flag: '🇸🇧' },
    { code: 'SOM', name: 'Somalia', flag: '🇸🇴' },
    { code: 'ZAF', name: 'South Africa', flag: '🇿🇦' },
    { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'SSD', name: 'South Sudan', flag: '🇸🇸' },
    { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
    { code: 'LKA', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'SDN', name: 'Sudan', flag: '🇸🇩' },
    { code: 'SUR', name: 'Suriname', flag: '🇸🇷' },
    { code: 'SWE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'CHE', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'SYR', name: 'Syria', flag: '🇸🇾' },
    { code: 'TWN', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'TJK', name: 'Tajikistan', flag: '🇹🇯' },
    { code: 'TZA', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'THA', name: 'Thailand', flag: '🇹🇭' },
    { code: 'TLS', name: 'Timor-Leste', flag: '🇹🇱' },
    { code: 'TGO', name: 'Togo', flag: '🇹🇬' },
    { code: 'TON', name: 'Tonga', flag: '🇹🇴' },
    { code: 'TTO', name: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: 'TUN', name: 'Tunisia', flag: '🇹🇳' },
    { code: 'TUR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'TKM', name: 'Turkmenistan', flag: '🇹🇲' },
    { code: 'TUV', name: 'Tuvalu', flag: '🇹🇻' },
    { code: 'UGA', name: 'Uganda', flag: '🇺🇬' },
    { code: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'ARE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'USA', name: 'United States', flag: '🇺🇸' },
    { code: 'URY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
    { code: 'VUT', name: 'Vanuatu', flag: '🇻🇺' },
    { code: 'VEN', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'VNM', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'YEM', name: 'Yemen', flag: '🇾🇪' },
    { code: 'ZMB', name: 'Zambia', flag: '🇿🇲' },
    { code: 'ZWE', name: 'Zimbabwe', flag: '🇿🇼' },
  ];
  
  export default countries;
  