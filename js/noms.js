/* La Permanence — la source unique des noms (1.3.0 « Les visages et les noms »).
   Tout nom de personne du jeu vient d'ici : clients, victimes, témoins, voisins, équipe du cabinet, jurés, policiers,
   médecins et experts tirés par le générateur. Les personnages récurrents gardent le nom écrit sur leur fiche.

   Les noms de famille vont par ensembles (l'Île-de-France d'aujourd'hui), rangés du plus courant au plus rare : le tirage
   suit ce rang (« Martin » revient souvent, « Wiśniewski » rarement). Les prénoms de chaque ensemble portent les décennies
   de naissance où on les donnait (« Josiane:4-5 » : années 1940 et 1950 ; 10 = années 2000, 11 = années 2010).
   Le prénom et le nom se tirent ensemble, dans le même ensemble ; environ une fois sur six, le prénom vient d'un autre
   ensemble (les assemblages mixtes de la vie). Rien ici ne règle le visage : la banque de visages reste libre.

   ANCIENS : les listes d'avant la 1.3.0, gardées pour rejouer à l'identique les affaires de la version 4 du générateur,
   les anciennes sauvegardes, et pour garder leur nom aux personnes déjà rencontrées (magistrats des autres tribunaux). */
(function () {
  const CR = window.CR;
  const N = (CR.NOMS = {});
  const L = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  // prénoms : « Nom:a-b » (décennies) ; « Nom:a » = une seule décennie
  const P = (s) => L(s).map((x) => { const [n, r] = x.split(":"); const [a, b] = (r || "4-11").split("-").map(Number); return [n, a, b == null ? a : b]; });

  N.ENS = {
    france: { w: 50,
      noms: L("Martin, Bernard, Thomas, Petit, Robert, Richard, Durand, Dubois, Moreau, Laurent, Simon, Michel, Lefebvre, Leroy, Roux, David, Bertrand, Morel, Fournier, Girard, Bonnet, Dupont, Lambert, Fontaine, Rousseau, Vincent, Muller, Lefèvre, Faure, André, Mercier, Blanc, Guérin, Boyer, Garnier, Chevalier, François, Legrand, Gauthier, Perrin, Robin, Clément, Morin, Nicolas, Henry, Roussel, Mathieu, Gautier, Masson, Marchand, Duval, Denis, Dumont, Marie, Lemaire, Noël, Meyer, Dufour, Meunier, Brun, Blanchard, Giraud, Joly, Rivière, Lucas, Brunet, Gaillard, Barbier, Arnaud, Gérard, Roche, Renard, Schmitt, Roy, Leroux, Colin, Vidal, Caron, Picard, Roger, Fabre, Aubert, Lemoine, Renaud, Dumas, Lacroix, Olivier, Philippe, Bourgeois, Pierre, Benoît, Rey, Leclerc, Payet, Rolland, Leclercq, Guillaume, Lecomte, Jean, Dupuy, Guillot, Hubert, Berger, Carpentier, Dupuis, Moulin, Louis, Deschamps, Huet, Vasseur, Boucher, Fleury, Royer, Klein, Jacquet, Adam, Paris, Poirier, Marty, Aubry, Guyot, Carré, Charles, Renault, Charpentier, Ménard, Maillard, Baron, Bertin, Bailly, Hervé, Schneider, Le Gall, Collet, Léger, Bouvier, Julien, Prévost, Millet, Perrot, Daniel, Le Roux, Cousin, Germain, Breton, Besson, Langlois, Rémy, Le Goff, Pelletier, Lévêque, Perrier, Leblanc, Barré, Lebrun, Marchal, Weber, Mallet, Hamon, Boulanger, Jacob, Monnier, Michaud, Guichard, Gillet, Étienne, Grondin, Poulain, Tessier, Collin, Chauvin, Bouchet, Gay, Lemaître, Bénard, Maréchal, Humbert, Reynaud, Antoine, Hoarau, Perret, Barthélemy, Cordier, Pichon, Lejeune, Gilbert, Lamy, Delaunay, Pasquier, Carlier, Laporte, Le Bihan, Le Floch, Le Corre, Kerbrat, Quéré, Riou, Guillou, Tanguy, Jégou, Normand, Lagarde, Lebon, Delmas, Baudry, Rigaud, Texier, Vallée, Labbé, Ferrand, Joubert, Valette, Cazeneuve, Desforges, Tavernier, Mabille, Esnault, Bouvet, Granger, Jourdan, Hamel, Lacoste, Leveque, Rocher, Seguin, Turpin, Vial, Brunel, Courtois, Delattre, Lemercier, Pons, Fischer, Wagner, Hoffmann, Bauer, Kieffer, Peltier, Gros, Chauvet, Thibault, Bigot, Marion, Ollivier, Raynaud, Chartier, Navarre, Sauvage, Bazin, Prigent, Allard, Blondel, Couturier, Lamotte, Mangin, Lenoir, Grandjean, Caron-Lefèvre, Saint-Martin, Dupont-Moreau, de Montclos, du Plessis, de Kervéguen, de Lassalle, d'Aubigny, de La Bretèche, de Saint-Aubin, de Vallois, Le Moal, Le Guen, Le Meur"),
      m: P("Jean:4-5, Michel:4-5, Pierre:4-6, Bernard:4-5, Gérard:4-5, Jacques:4-5, Alain:4-6, Daniel:4-6, Roger:4, Robert:4, André:4, René:4, Guy:4-5, Marcel:4, Jean-Pierre:4-6, Jean-Claude:4-5, Jean-Louis:4-6, Jean-Marie:4-6, Gilles:5-6, Patrick:5-6, Philippe:5-7, Christian:4-6, Joël:5-6, Serge:4-5, Yves:4-5, Didier:5-6, Thierry:5-7, Pascal:5-7, Éric:5-7, Bruno:5-7, Jean-Marc:5-7, Laurent:6-7, Frédéric:6-8, Christophe:6-8, Olivier:6-8, Stéphane:6-8, Franck:6-8, Hervé:5-7, Lionel:6-7, Fabrice:6-8, Vincent:6-8, Jérôme:7-8, Sébastien:7-8, Nicolas:7-9, David:7-8, Cédric:7-8, Julien:7-9, Guillaume:7-9, Mickaël:7-8, Grégory:7-8, Arnaud:7-8, Damien:7-8, Jérémy:8-9, Anthony:8-9, Romain:8-9, Kevin:8-9, Mathieu:7-9, Florian:8-9, Maxime:8-10, Alexandre:7-10, Thomas:8-10, Quentin:8-10, Benjamin:8-10, Antoine:8-11, Clément:8-10, Valentin:9-10, Hugo:9-11, Lucas:9-11, Théo:9-11, Dylan:9-10, Enzo:9-11, Mathis:10-11, Nathan:9-11, Tom:10-11, Louis:10-11, Jules:10-11, Gabriel:10-11, Arthur:10-11, Raphaël:10-11, Paul:10-11, Léo:10-11, Noah:11, Baptiste:9-10, Corentin:9-10, Loïc:8-9, Ludovic:7-8, Yannick:7-8, Bertrand:6-7, Xavier:6-8, Henri:4, François:4-6, Jean-François:5-7, Jean-Luc:5-6, Adrien:9-10, Victor:10-11, Martin:10-11, Timothée:10-11, Axel:10-11, Evan:10-11, Jean-Michel:5-6, Francis:4-5, Claude:4-5, Marc:5-7, Benoît:7-8, Emmanuel:7-8, Matthieu:8-9, Rémi:8-10, Alexis:9-10, Kylian:10-11, Mathéo:10-11, Gaspard:10-11, Augustin:10-11, Eliott:10-11"),
      f: P("Monique:4, Jacqueline:4, Josiane:4-5, Christiane:4-5, Michèle:4-5, Danielle:4-5, Françoise:4-5, Annie:4-5, Martine:4-6, Nicole:4-5, Sylvie:5-6, Catherine:5-6, Brigitte:4-6, Chantal:5-6, Évelyne:5-6, Marie-Christine:5-6, Isabelle:6-7, Nathalie:6-7, Valérie:6-7, Patricia:5-7, Corinne:6-7, Véronique:6-7, Sandrine:6-8, Christelle:7-8, Laurence:6-7, Pascale:6-7, Hélène:5-7, Florence:6-7, Karine:7-8, Stéphanie:7-8, Céline:7-8, Virginie:7-8, Delphine:7-8, Émilie:8-9, Aurélie:8-9, Julie:8-9, Mélanie:8-9, Audrey:8-9, Élodie:8-9, Jennifer:8-9, Jessica:8-9, Laura:9-10, Marion:8-10, Pauline:8-10, Marine:9-10, Anaïs:9-10, Océane:9-10, Manon:9-11, Mathilde:9-11, Clara:10-11, Léa:9-11, Chloé:9-11, Emma:10-11, Jade:10-11, Louise:10-11, Alice:10-11, Romane:10-11, Zoé:10-11, Margaux:9-11, Juliette:10-11, Lucie:9-11, Charlotte:9-11, Agnès:5-6, Anne:5-7, Claire:6-9, Sophie:6-8, Marie:4-11, Ginette:4, Odette:4, Huguette:4, Colette:4, Mireille:4-5, Geneviève:4-5, Béatrice:5-6, Marie-Thérèse:4-5, Anne-Sophie:7-9, Marie-Laure:6-7, Élise:9-11, Ambre:10-11, Lola:10-11, Eva:10-11, Laetitia:7-8, Caroline:7-8, Amandine:8-9, Justine:9-10, Morgane:9-10, Agathe:10-11, Victoire:10-11, Rose:11, Capucine:10-11, Odile:4-5, Dominique:5-6"),
    },
    maghreb: { w: 16,
      noms: L("Benali, Haddad, Mansouri, Belkacem, Amrani, Bouaziz, Zerrouki, Hamidi, Saïdi, Messaoudi, Kaci, Rahmani, Bensaïd, Chérif, Aït-Ali, Benyahia, Boukhari, Brahimi, Djebbar, Ferhat, Gharbi, Hadjadj, Khelifi, Lahlou, Mebarki, Meziane, Nasri, Ouali, Rezgui, Slimani, Taleb, Yahiaoui, Zitouni, Belhadj, Benjelloun, El Amrani, El Idrissi, Bennani, Tazi, Alaoui, Chaouch, Djellali, Hamdi, Ben Youssef, Trabelsi, Ben Salah, Jaziri, Mekki, Benamar, Bouzid, Laïdi, Aouadi, Ouadah, Belaïd, Kebir, Belkadi, Boudjema, Saadi, Hamadi, Benmoussa, Zaoui, Amari, Achour, Tahri, Mokrani, Aït-Ouali, Bouchareb, Lounis, Hamou, Bennacer, Ziani, Bouabdallah, Chibane, Derradji, Guendouz, Hachemi, Kadri, Lakhdar, Madani, Naceri, Rahal, Sahraoui, Tounsi, Yousfi, Zemmouri, El Fassi, Ouazzani, Berrada, Chraïbi, Bensalem, Ait Lhadj, Mammeri, Bouguerra"),
      m: P("Mohamed:4-11, Ahmed:4-8, Ali:4-9, Abdelkader:4-6, Rachid:5-8, Mustapha:4-7, Brahim:5-8, Saïd:4-7, Djamel:5-8, Kamel:5-8, Farid:5-8, Karim:6-9, Nordine:6-8, Abdel:6-8, Samir:6-9, Hakim:6-9, Mourad:6-9, Nabil:6-9, Khaled:6-8, Malik:7-9, Mehdi:8-10, Sofiane:8-10, Yacine:8-10, Bilal:8-10, Anis:8-10, Ilyes:9-11, Wassim:9-10, Rayan:10-11, Adam:10-11, Yanis:9-11, Ayoub:10-11, Amine:8-10, Hamza:9-11, Imran:10-11, Ismaël:9-11, Youssef:8-11, Zakaria:9-11, Nassim:8-10, Redouane:7-9, Larbi:4-5, Messaoud:4-5, Omar:6-11, Salim:7-10, Walid:8-10, Soufiane:8-10, Idriss:10-11, Abdelaziz:4-6, Hocine:4-6, Lakhdar:4-5, Fouad:6-8, Driss:5-7, Tarek:7-9, Riad:7-9, Nadir:7-9, Sami:8-11, Ilian:11, Younes:9-11, Aymen:10-11, Selim:9-11"),
      f: P("Fatima:4-8, Khadija:4-7, Aïcha:4-11, Zohra:4-5, Fatiha:5-7, Malika:5-7, Naïma:5-7, Saliha:5-6, Nadia:6-8, Samia:6-8, Karima:6-8, Leïla:6-10, Farida:5-7, Houria:5-6, Rachida:5-7, Amel:8-9, Sabrina:8-9, Assia:8-10, Kenza:9-11, Yasmina:8-9, Myriam:8-10, Sarah:8-11, Inès:9-11, Nour:10-11, Lina:10-11, Yasmine:9-11, Imane:9-10, Salma:10-11, Meriem:9-10, Dounia:8-10, Sonia:7-9, Samira:6-8, Djamila:5-7, Wafa:8-10, Rania:10-11, Maryam:10-11, Hiba:10-11, Soraya:7-9, Zineb:9-11, Hafsa:10-11, Nawel:8-10, Siham:8-10, Louisa:6-8, Ouardia:4-6, Habiba:4-6, Latifa:5-7, Souad:6-8, Fadila:5-7, Nesrine:9-11, Amira:9-11, Chaïma:10-11, Aya:10-11"),
    },
    afrique_ouest: { w: 8,
      noms: L("Diarra, Traoré, Camara, Sissoko, Koné, Fofana, Ndiaye, Keita, Cissé, Touré, Coulibaly, Diallo, Ouattara, Bah, Dembélé, Barry, Diop, Sow, Fall, Sylla, Konaté, Doucouré, Kanté, Soumaré, Tounkara, Sacko, Diakité, Dramé, Gassama, Sakho, Niang, Faye, Mbaye, Gueye, Seck, Ba, Kouyaté, Sangaré, Bamba, Kamara, Diawara, Magassa, Soumah, Baldé, Sall, Thiam, Ndour, Tandia, Doumbia, Yattara, Fadiga, Cissoko, Dabo, Sidibé, Kouassi, Koffi, Yao, N'Guessan, Kouamé, Konan, Tall, Mendy, Sarr, Ndao, Samaké, Tangara"),
      m: P("Mamadou:5-10, Moussa:5-10, Ibrahima:5-10, Ousmane:5-10, Amadou:5-9, Abdoulaye:5-10, Souleymane:6-10, Cheikh:6-10, Adama:6-11, Issa:7-11, Boubacar:5-9, Bakary:5-9, Seydou:5-9, Lamine:6-10, Oumar:6-10, Modibo:5-8, Youssouf:7-11, Aboubakar:8-11, Sékou:6-9, Idrissa:7-10, Djibril:9-11, Aliou:7-10, Samba:5-8, Demba:5-8, Mahamadou:6-9, Karamoko:5-7, Kouadio:6-9, Yannick:8-9, Serge:6-8, Ismaïla:8-11, Mamoudou:7-10, Alassane:6-9, Fodé:6-9, Ladji:7-9, Sidiki:6-9"),
      f: P("Fatou:5-11, Aminata:5-11, Mariam:6-11, Hawa:5-10, Awa:5-11, Kadiatou:5-10, Rokia:6-10, Fatoumata:5-11, Assa:6-10, Aïssatou:5-10, Coumba:5-9, Ndeye:6-10, Binta:5-9, Oumou:5-9, Sira:6-9, Mariama:6-11, Djeneba:6-10, Ramatoulaye:6-10, Khadidiatou:5-9, Nafissatou:7-10, Astou:6-10, Mame:6-10, Adjoua:6-9, Affoué:6-9, Salimata:6-10, Bintou:7-10, Kadidia:7-10, Aïssata:8-11"),
    },
    afrique_centrale: { w: 4,
      noms: L("Mbemba, Nkounkou, Mabiala, Tshibanda, Kalonji, Mukendi, Ilunga, Ngoma, Makosso, Ekotto, Nguema, Mbarga, Essomba, Ndongo, Tchamba, Fotso, Kamga, Nana, Tchoumi, Mavoungou, Moukala, Bakala, Massamba, Okemba, Ebanga, Owona, Mbida, Atangana, Biyong, Mukuna, Lukusa, Mpia, Kitenge, Nsimba, Lumbu, Kiala, Bongo-Ndong, Mabika, Tsiba, Loemba, Kimbembe, Matondo, Mampuya, Nzeza"),
      m: P("Christian:5-7, Patrick:5-7, Serge:5-7, Fabrice:6-8, Hervé:6-8, Landry:7-9, Arsène:6-8, Blaise:6-8, Rodrigue:7-9, Prince:9-11, Jordan:9-10, Junior:9-11, Christ:9-11, Exaucé:9-11, Divin:10-11, Emmanuel:6-10, Dieudonné:5-7, Florent:7-9, Cyrille:7-9, Ghislain:6-8, Willy:7-9, Steve:8-10, Joël:6-8, Aristide:6-8, Jonathan:8-10, Noé:10-11, Glody:9-11"),
      f: P("Grâce:8-11, Merveille:9-11, Divine:10-11, Prisca:8-10, Gloria:8-10, Ornella:9-10, Esther:7-11, Ruth:7-11, Chancelle:9-11, Nadège:7-9, Bénédicte:6-8, Clarisse:7-9, Régine:5-7, Marlène:6-8, Exaucée:10-11, Joëlle:6-8, Carine:7-9, Prudence:8-10, Victoire:9-11, Gracia:10-11, Sylvie:5-7, Pascaline:6-8"),
    },
    antilles: { w: 4,
      noms: L("Jean-Baptiste, Saint-Louis, Marie-Sainte, Joseph, Pierre-Louis, Bellance, Agathe, Lubin, Desvarieux, Mondésir, Céleste, Ursule, Bonheur, Lafleur, Clairville, Belfort, Désiré, Fortuné, Hippolyte, Laventure, Sainte-Rose, Démosthène, Toussaint, Édouard, Calixte, Jean-Charles, Bélizaire, Florentin, Nestor, Romain-Désiré, Théodose, Ferdinand, Saint-Ange, Plantier, Mathurin, Valcin"),
      m: P("Patrice:5-7, Teddy:7-9, Johan:8-10, Willy:7-9, Ludovic:7-9, Steeve:8-9, Kévin:8-9, Dorian:9-11, Jimmy:7-9, Rudy:7-9, Wilfried:7-9, Lenny:10-11, Ethan:10-11, Kenzo:10-11, Jean-Claude:4-6, Joël:5-7, Max:5-7, Harry:6-8, Frantz:5-7, Gaël:8-10, Timothy:9-11, Lucien:4-5, Emmanuel:6-8, Ruddy:7-9"),
      f: P("Marie-Josée:4-6, Marie-Line:5-7, Josiane:4-6, Ginette:4-5, Murielle:6-8, Nadège:6-8, Laetitia:7-9, Cindy:8-9, Mélissa:8-10, Maëlys:10-11, Kelly:8-9, Johanna:8-10, Lorena:9-11, Marie-Noëlle:5-7, Jocelyne:5-6, Rose-Marie:4-6, Daniella:8-10, Ketty:7-9, Lindsay:9-10, Inaya:10-11, Shaïna:10-11"),
    },
    portugal: { w: 5,
      noms: L("Da Silva, Ferreira, Pereira, Dos Santos, Rodrigues, Fernandes, Gonçalves, Lopes, Martins, Teixeira, Ribeiro, Carvalho, Oliveira, Sousa, Mendes, Pinto, Moreira, Coelho, Cardoso, Gomes, Alves, Marques, Correia, Nunes, Soares, Machado, Fonseca, Rocha, Monteiro, Azevedo, Pires, Vieira, Barbosa, Da Costa, Freitas, Cunha, Araújo, Lima, Antunes, Tavares, Magalhães, Baptista, Simões, Fernandes Da Silva, Matos, Brandão, Quintas, Salgado"),
      m: P("José:4-8, Manuel:4-8, António:4-7, Joaquim:4-6, Carlos:5-8, Fernando:5-8, Paulo:6-8, Rui:6-8, Nuno:7-9, Pedro:7-10, Tiago:9-11, João:6-11, Ricardo:7-9, Sérgio:6-8, Luís:6-9, Diogo:9-11, Cristiano:9-10, Rafael:9-11, Mário:5-7, Hélder:7-9, Vítor:6-8, Gonçalo:9-11, Duarte:10-11, Francisco:4-6"),
      f: P("Maria:4-11, Ana:5-11, Fernanda:4-6, Isabel:5-7, Rosa:4-6, Lurdes:4-6, Fátima:4-7, Sónia:7-8, Cátia:8-9, Sandra:7-8, Vanessa:8-9, Daniela:8-10, Beatriz:10-11, Carla:7-8, Cristina:6-8, Joana:8-10, Mariana:10-11, Sofia:10-11, Glória:4-6, Graça:5-7, Filipa:8-10, Leonor:10-11"),
    },
    sud_europe: { w: 4,
      noms: L("Garcia, Martinez, Lopez, Sanchez, Fernandez, Perez, Rodriguez, Gonzalez, Gomez, Ruiz, Hernandez, Diaz, Moreno, Muñoz, Alvarez, Romero, Navarro, Torres, Dominguez, Gil, Rossi, Russo, Ferrari, Esposito, Bianchi, Romano, Colombo, Ricci, Marino, Greco, Gallo, Conti, De Luca, Mancini, Giordano, Rizzo, Lombardi, Moretti, Barbieri, Santoro, Mariani, Rinaldi, Caruso, Ferrara, Galli, Martini, Leone, Longo, Gentile, Vitale, Serra, Coppola, De Santis, D'Angelo, Marchetti, Parisi, Fabbri, Pellegrini, Bellini, Carbone, Ortega, Delgado, Castillo, Ramos, Vasquez, Iglesias, Pastor, Santiago"),
      m: P("Antonio:4-7, Giuseppe:4-6, Salvatore:4-6, Francesco:5-8, Marco:6-9, Luca:8-11, Matteo:9-11, Alessandro:7-10, Javier:6-9, Juan:4-7, Miguel:5-8, Alejandro:8-10, Pablo:9-11, Sergio:6-9, Lorenzo:10-11, Mario:4-7, Dario:7-9, Fabio:7-9, Vicente:4-6, Ángel:5-8, Giovanni:4-6, Andrea:7-10, Leonardo:10-11"),
      f: P("Giulia:9-11, Francesca:6-9, Carmen:4-7, Dolores:4-6, Pilar:4-6, Lucia:9-11, Elena:8-11, Paola:6-8, Sara:8-11, Chiara:9-11, Alessandra:7-9, Concetta:4-5, Marisa:5-7, Nuria:7-9, Paloma:9-11, Rosaria:4-6, Mercedes:4-6, Inmaculada:5-7, Silvia:7-9, Valentina:9-11, Martina:10-11"),
    },
    europe_est: { w: 3,
      noms: L("Popescu, Ionescu, Popa, Dumitru, Stan, Stoica, Gheorghe, Rusu, Munteanu, Constantin, Kowalski, Nowak, Wiśniewski, Wójcik, Kowalczyk, Kamiński, Lewandowski, Zieliński, Szymański, Dąbrowski, Kozlov, Ivanov, Petrov, Smirnov, Volkov, Kovalenko, Shevchenko, Bondarenko, Tkachenko, Novak, Horvat, Petrović, Jovanović, Nikolić, Marković, Dimitrov, Georgiev, Kovač, Varga, Molnár, Nagy, Moldovan, Lungu, Ciobanu, Mazur, Krawczyk"),
      m: P("Andrei:7-10, Ion:5-8, Mihai:7-10, Alexandru:8-11, Florin:7-9, Bogdan:7-9, Marius:7-9, Piotr:6-9, Tomasz:7-9, Krzysztof:6-8, Paweł:7-9, Jan:5-11, Vladimir:5-8, Sergueï:5-8, Dmitri:7-10, Oleksandr:8-10, Ivan:6-11, Nikola:8-11, Stefan:7-10, Adrian:7-10, Milan:9-11, Gheorghe:4-6, Vasile:4-7, Jerzy:4-6, Darius:9-11"),
      f: P("Ioana:8-10, Andreea:8-10, Mihaela:7-9, Anna:6-11, Katarzyna:7-9, Agnieszka:7-9, Magdalena:7-9, Olga:5-8, Natalia:7-10, Irina:6-9, Oksana:7-9, Svetlana:6-8, Daria:9-11, Alexandra:8-10, Larisa:7-9, Milena:9-11, Zofia:10-11, Elena:6-10, Maria:5-11, Teodora:9-11, Halina:4-6, Doina:5-7"),
    },
    asie: { w: 3,
      noms: L("Nguyen, Tran, Le, Pham, Hoang, Vu, Phan, Dang, Bui, Do, Ngo, Duong, Ly, Truong, Huynh, Chen, Wang, Zhang, Liu, Yang, Huang, Zhou, Wu, Xu, Sun, Chea, Sok, Keo, Lim, Tan, Vong, Chau, Lam, Ung, Taing, Hem"),
      m: P("Minh:6-10, Duc:6-9, Thanh:5-9, Huy:8-11, Tuan:7-9, Wei:8-11, Jian:7-10, Hao:8-11, Vuthy:6-8, Quang:5-8, Hung:5-8, Bao:9-11, Yi:9-11, Kai:10-11, Chandara:6-8, Sopheak:7-9, Lei:8-11, Vannak:7-9"),
      f: P("Mai:6-10, Linh:7-10, Thu:6-9, Lan:5-8, Hoa:5-8, Ngoc:6-9, Mei:8-11, Xiaoyan:7-9, Ying:7-10, Sophea:7-9, Chantha:6-8, Kim:7-10, Thuy:6-9, Hanh:6-8, Yan:8-11, Jiayi:10-11, Sreymom:7-9, Phuong:6-9"),
    },
    turquie: { w: 1.5,
      noms: L("Yılmaz, Kaya, Demir, Şahin, Çelik, Yıldız, Yıldırım, Öztürk, Aydın, Özdemir, Arslan, Doğan, Kılıç, Aslan, Çetin, Kara, Koç, Kurt, Özkan, Şimşek, Polat, Korkmaz, Akın, Erdem, Güneş, Tekin, Bulut, Avcı"),
      m: P("Mehmet:5-9, Mustafa:5-9, Ahmet:5-9, Hasan:5-9, Hüseyin:5-8, Emre:8-10, Murat:7-9, Burak:8-10, Can:9-11, Yusuf:8-11, Ömer:8-11, Kerem:9-11, Serkan:7-9, Kemal:5-8, Berat:10-11, Eymen:11, Erkan:6-8"),
      f: P("Ayşe:5-9, Fatma:5-8, Emine:5-8, Elif:9-11, Zeynep:9-11, Merve:9-10, Esra:8-10, Büşra:9-10, Hatice:5-8, Derya:7-9, Selin:9-11, Ecrin:10-11, Gül:5-8, Sevgi:6-8, Defne:10-11"),
    },
    sefarade: { w: 1,
      noms: L("Cohen, Lévy, Attal, Benhamou, Zerbib, Amar, Bensimon, Elbaz, Haziza, Sebag, Azoulay, Benichou, Ohayon, Assouline, Dahan, Abitbol, Toledano, Uzan, Nahmias, Sitbon, Benzaquen, Boukobza, Chiche, Guedj, Soussan"),
      m: P("Gilbert:4-6, Albert:4-5, Élie:5-8, Jonathan:8-10, Yoann:8-10, Ilan:9-11, Samuel:8-11, Haïm:5-8, Simon:6-11, Ariel:8-10, Dan:9-11, Michaël:7-9, Jacob:9-11, Raphaël:9-11, Benjamin:8-10, Joseph:4-6, Maurice:4-5, Gabriel:9-11"),
      f: P("Esther:6-11, Rachel:6-10, Déborah:8-9, Noémie:8-10, Shirel:10-11, Hannah:10-11, Yvette:4-5, Sarah:7-11, Myriam:7-10, Mireille:4-6, Liliane:4-5, Judith:6-8, Tamar:10-11, Laura:8-10, Annabelle:8-10"),
    },
    asie_sud: { w: 1,
      noms: L("Sivakumar, Rajendran, Kanagaratnam, Selvarajah, Murugan, Krishnan, Balasubramaniam, Ravichandran, Sritharan, Kumar, Singh, Sharma, Patel, Khan, Hussain, Chowdhury, Rahman, Begum, Mahmood, Iqbal, Nadarajah, Thevarajah, Uddin, Miah"),
      m: P("Suresh:6-9, Ramesh:6-8, Vijay:7-10, Arjun:9-11, Karthik:9-11, Sanjay:7-9, Rajan:5-8, Pradeep:7-9, Faisal:7-10, Rahul:9-11, Tharshan:9-11, Kishore:8-10, Arif:7-9, Shahid:6-9, Rohan:10-11, Aarav:11"),
      f: P("Priya:8-11, Anjali:8-10, Kavitha:7-9, Lakshmi:6-9, Divya:8-10, Meena:6-9, Shanthi:6-8, Ayesha:9-11, Sana:9-11, Nisha:8-10, Tharani:9-11, Nasrin:7-9, Shabana:6-8, Diya:10-11"),
    },
  };
  // prénoms épicènes : donnés aux deux sexes, tirés à part (environ un sur cinquante)
  N.EPI = P("Camille:7-11, Dominique:5-6, Claude:4-5, Sacha:9-11, Charlie:10-11, Alix:9-11, Eden:10-11, Noa:10-11, Andréa:9-11, Morgan:8-9, Yaël:9-11, Ange:8-10, Lou:10-11, Maël:10-11, Swann:10-11");

  // ------------------------------------------------------------------ listes d'avant la 1.3.0 (ne pas modifier)
  N.ANCIENS = {
    monde: {
      PM: ["Mehdi", "Kevin", "Julien", "Moussa", "Thomas", "Bilal", "Nicolas", "Ibrahima", "Florian", "Sofiane", "Damien", "Alexandre", "Yacine", "Maxime", "Samir", "Loïc", "Adama", "Romain", "Anis", "Quentin", "Mamadou", "Hugo", "Karim", "Lucas", "Ousmane", "Théo", "Rayan", "Antoine", "Wassim", "Cédric", "Jonathan", "Brahim", "Arnaud", "Steeve", "Cheikh", "Mathieu", "Ilyes", "Jérôme", "Dylan", "Patrick", "Abdel", "Grégory", "Souleymane", "Vincent", "Nordine", "Franck", "Issa", "Baptiste", "Malik", "Jean-Marc"],
      PF: ["Inès", "Laura", "Fatou", "Camille", "Sarah", "Amel", "Julie", "Aïcha", "Manon", "Léa", "Nadia", "Océane", "Kenza", "Marine", "Assia", "Pauline", "Mariam", "Chloé", "Yasmina", "Émilie", "Aminata", "Sabrina", "Clara", "Leïla", "Sandrine", "Dounia", "Mélissa", "Hawa", "Nathalie", "Samia", "Jessica", "Awa", "Céline", "Rokia", "Margaux", "Sonia"],
      NOMS: ["Bensaïd", "Martin", "Diarra", "Lefebvre", "Haddad", "Moreau", "Traoré", "Girard", "Mansouri", "Petit", "Camara", "Roux", "Belkacem", "Fournel", "Sissoko", "Garnier", "Amrani", "Lambert", "Koné", "Dubois", "Chérif", "Bonnet", "Fofana", "Lemoine", "Benali", "Mercier", "Ndiaye", "Faure", "Bouaziz", "Rousseau", "Keita", "Blanc", "Zerrouki", "Guérin", "Cissé", "Morel", "Hamidi", "Leroy", "Touré", "Perrin", "Saïdi", "Chevalier", "Coulibaly", "Robin", "Aït-Ali", "Masson", "Diallo", "Henry", "Ouattara", "Gauthier", "Messaoudi", "Nicolas", "Bah", "Durand", "Kaci", "Lopez", "Dembélé", "Fontaine", "Rahmani", "Pereira", "Nguyen", "Da Silva", "Ferreira", "Cohen", "Popescu", "Kowalski", "Ben Youssef", "Barry", "Mendy", "Vidal"],
      GPX: ["Karim Ouali", "Léa Perret", "Julien Moreau", "Sarah Benchetrit", "Kévin Lopes", "Aurélie Dumont", "Mickaël Tessier", "Nadia Ferhat", "Thomas Vasseur", "Inès Bouchard"],
      VOISINS: [["Mme", "Josiane Leclerc", 74], ["M.", "Ahmed Bouzid", 41], ["Mme", "Camille Perrin", 29], ["M.", "Gérard Masson", 66], ["Mme", "Fatoumata Sy", 35], ["M.", "Lucas Hoarau", 23]],
    },
    gen1: {
      PM: ["Mehdi", "Kevin", "Julien", "Moussa", "Thomas", "Bilal", "Nicolas", "Ibrahima", "Florian", "Sofiane", "Damien", "Alexandre", "Yacine", "Maxime", "Samir", "Loïc", "Adama", "Romain", "Anis", "Quentin"],
      PF: ["Inès", "Laura", "Fatou", "Camille", "Sarah", "Amel", "Julie", "Aïcha", "Manon", "Léa", "Nadia", "Océane", "Kenza", "Marine", "Assia", "Pauline"],
    },
    mag: {
      NOMS: ["Belhadj", "Okafor", "Pichon", "Morvillier", "Abadie", "Fontanel", "Ngom", "Garrigues", "Rouvier", "Desforges", "Lebrun", "Hervé", "Lambertin", "Cazeneuve", "Roux-Diallo", "Lenoir", "Vallet", "Bouvier", "de Montclos", "Kerbrat", "Ribes", "Marchand", "Benjelloun", "Duroc", "Esnault", "Tavernier", "Quéré", "Lagarde", "Mabille", "Sanchez", "Ferrand", "Picot", "Hamel", "Bertin", "Joubert", "Valette", "Cordier", "Lemarchand", "Thibault", "Aubry", "Gilbert", "Mercadier", "Delorme", "Sarr", "Kouyaté", "Weiss", "Leclerc", "Poulain"],
      PRENOMS: { m: ["Karim", "Laurent", "Thierry", "Olivier", "Mathieu", "Pascal", "Julien", "Frédéric", "Christophe", "Henri", "Antoine", "Youssef", "Guillaume", "Benoît", "Arnaud", "Xavier"], f: ["Sabine", "Agnès", "Claire", "Hélène", "Isabelle", "Martine", "Zoé", "Amina", "Laetitia", "Sophie", "Céline", "Catherine", "Nathalie", "Véronique", "Anne", "Marion"] },
    },
    equipe: {
      PF: ["Inès", "Sarah", "Léa", "Chloé", "Manon", "Amina", "Clara", "Zoé", "Camille", "Yasmine", "Laura", "Mathilde", "Fatou", "Julie", "Héloïse", "Nadia", "Anaïs", "Margaux"],
      PM: ["Lucas", "Hugo", "Nathan", "Yanis", "Théo", "Jules", "Rayan", "Adam", "Karim", "Thomas", "Mehdi", "Antoine", "Samuel", "Bilal", "Romain", "Victor", "Issa", "Paul"],
    },
  };
  N.ANCIENS.gen1.NOMS = ["Bensaïd", "Martin", "Diarra", "Lefebvre", "Haddad", "Moreau", "Traoré", "Girard", "Mansouri", "Petit", "Camara", "Roux", "Belkacem", "Fournel", "Sissoko", "Garnier", "Amrani", "Lambert", "Kone", "Dubois", "Chérif", "Bonnet", "Fofana", "Lemoine"];
  // noms écrits en dur dans les pièces avant la 1.3.0 (affaires de la version 4 seulement)
  Object.assign(N.ANCIENS, {
    opjCrim: ["Hélène Garnier", "Marc Viallet", "Sonia Rahmani", "Pierre Lestrade", "Aurélie Dumas", "Karim Benhamou"],
    medecinsGav: ["Hugo Lemaire", "Amina Saïdi", "Paul Ferrand", "Claire Bouvier"],
    urgentistes: ["Antoine Mercier", "Salomé Riva", "Karim Haddad", "Inès Morel"],
    badges: ["Karima L.", "Julien M.", "Sophie D.", "Thomas R.", "Aminata K.", "Pierre V."],
    medecins: ["Claire Aubry", "Mehdi Slimani", "Antoine Vasseur", "Hélène Marchetti", "Olivier Deschamps", "Samia Khelifi", "Bertrand Lemaire", "Julie Nguyen", "François Carlier", "Nora Benhamou"],
    agents: ["Nadia Ferhat", "Thomas Vasseur", "Inès Bouchard", "Mickaël Tessier", "Karim Ouali", "Léa Perret", "Yann Kervella", "Sophie Marin"],
    legistes: ["Élise Vannier", "Marc Dubreuil", "Nora Belhadj", "Thomas Lepage", "Anne Collard"],
    journalistes: { F: ["Claire", "Inès", "Margaux", "Sonia", "Léa"], M: ["Hugo", "Karim", "Julien", "Thomas", "Romain"], NOMS: ["Lemercier", "Benhamou", "Ravier", "Ollivier", "Tessier", "Mbaye"] },
    colocs: { PRENOMS: ["Yanis", "Mehdi", "Lucas", "Inès", "Sofiane", "Clara"], NOMS: ["Bensalem", "Garnier", "Diakité", "Morel", "Haddad"] },
    agentsSecu: { PRENOMS: ["Moussa", "Kevin", "Yacine", "Sébastien", "Fatou", "Aïssatou", "Steeve", "Nadia"], NOMS: ["Diallo", "Martin", "Benali", "Lefèvre", "Camara", "Rousseau", "Traoré"] },
    avocats: ["Me Caroline Besnard", "Me Idriss Hamdi", "Me Paul Etcheverry", "Me Sonia Guerrier", "Me Vincent Laroque", "Me Fatou Diallo"],
    jures: { PRENOMS: ["Martine", "Karim", "Sylvie", "Olivier", "Fatoumata", "Jean-Luc", "Nathalie", "Thomas", "Samia", "Patrick", "Élodie", "Bruno", "Hélène", "Mamadou", "Isabelle", "Franck", "Sophie", "Ahmed", "Céline", "Laurent"], NOMS: ["Dupont", "Benali", "Lemoine", "Garnier", "Traoré", "Rousseau", "Fontaine", "Morel", "Chevalier", "Mercier", "Blanc", "Guerin", "Muller", "Henry", "Perrin", "Robin", "Masson", "Sanchez", "Nicolas", "Gauthier"] },
  });

  // ------------------------------------------------------------------ tirage
  const ENS = Object.keys(N.ENS);
  const POIDS = ENS.map((k) => N.ENS[k].w), TOT = POIDS.reduce((a, b) => a + b, 0);
  const tirerEns = (r) => { let x = r() * TOT; for (let i = 0; i < ENS.length; i++) { x -= POIDS[i]; if (x < 0) return ENS[i]; } return ENS[0]; };
  // rang → poids : le nom le plus courant revient trois à cinq fois plus que le plus rare de sa liste
  const parRang = (r, a) => { const n = a.length, w = (i) => 1 / Math.pow(i + 12, 0.6); let t = 0; for (let i = 0; i < n; i++) t += w(i); let x = r() * t; for (let i = 0; i < n; i++) { x -= w(i); if (x < 0) return a[i]; } return a[n - 1]; };
  N.decennie = (an) => Math.max(4, Math.min(11, Math.floor(an / 10) - 190));
  N.ensembles = ENS;
  N.tirerEnsemble = tirerEns;
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const parPortee = (r, a) => { const w = (x) => 1 / (1 + (x[2] - x[1]) * 0.45); let t = 0; for (const x of a) t += w(x); let v = r() * t; for (const x of a) { v -= w(x); if (v < 0) return x; } return a[a.length - 1]; };
  // les prénoms de la décennie (à une décennie près s'il le faut) ; aucun : null, et l'appelant prend un autre ensemble
  const deLaDecennie = (liste, d) => { for (let marge = 0; marge < 2; marge++) { const ok = liste.filter((x) => x[1] - marge <= d && d <= x[2] + marge); if (ok.length) return ok; } return null; };
  // Un prénom de la génération de l'année de naissance « an », dans l'ensemble « ens »
  N.prenom = function (r, g, an, ens, o = {}) {
    const d = N.decennie(an);
    if (!o.sansEpicene && r() < 0.02) { const e = (deLaDecennie(N.EPI, d) || []).filter((x) => x[1] <= d && d <= x[2]); if (e.length) return { prenom: pk(r, e)[0], pens: ens, epicene: true }; }
    // un sur six : le prénom vient d'un autre ensemble que le nom
    const autre = () => { for (let k = 0; k < 8; k++) { const e = tirerEns(r); if (e !== ens) return e; } return ens === "france" ? "maghreb" : "france"; };
    let pens = o.pens || (r() < 1 / 6 ? autre() : ens);
    const de = (k) => (deLaDecennie(N.ENS[k][g === "f" ? "f" : "m"], d) || []).filter((x) => !(o.sauf || []).includes(x[0]));
    let liste = de(pens);
    // un ensemble sans prénom de cette génération (les plus âgés d'une immigration récente) : les prénoms de France
    if (!liste.length) { pens = "france"; liste = de(pens); }
    // un prénom donné sur six décennies (Marie, Mohamed) n'est pas six fois plus fréquent à chaque génération
    return { prenom: parPortee(r, liste)[0], pens };
  };
  // Un nom de famille de l'ensemble ; nés après 2005 : parfois les deux noms des parents
  N.nom = function (r, ens, an) {
    let nom = parRang(r, N.ENS[ens].noms);
    if (an >= 2005 && r() < 0.08 && !/-|^d[eu'] |^D'/.test(nom)) { const n2 = parRang(r, N.ENS[r() < 0.7 ? ens : tirerEns(r)].noms); if (n2 !== nom && !/-|^d[eu'] /.test(n2)) nom = nom + "-" + n2; }
    return nom;
  };
  // Une identité : { prenom, nom, ens, pens } ; o : { g, an, ens, nom (imposé), pens (ensemble des prénoms de la fratrie),
  // sauf (prénoms à éviter), eviter (Set de noms complets et de noms de famille déjà pris) }
  N.identite = function (r, o) {
    const g = o.g === "f" ? "f" : "m", an = o.an || 1985;
    for (let k = 0; k < 12; k++) {
      const ens = o.ens || tirerEns(r);
      const nom = o.nom || N.nom(r, ens, an);
      const p = N.prenom(r, g, an, ens, { pens: o.pens, sauf: o.sauf, sansEpicene: !!o.pens });
      if (p.prenom === nom || nom.split(/[- ]/).includes(p.prenom)) continue;
      if (o.eviter && (o.eviter.has(p.prenom + " " + nom) || (!o.nom && o.eviter.has("nom:" + nom)))) continue;
      return { prenom: p.prenom, nom, ens, pens: p.pens };
    }
    return { prenom: N.prenom(r, g, an, "france", { sansEpicene: true }).prenom, nom: o.nom || N.nom(r, "france", an) + "-" + N.nom(r, "maghreb", an), ens: "france", pens: "france" };
  };
  // Les noms réservés : ceux des personnages récurrents (magistrats, policiers, confrères, la mentore, la promotion)
  let reserves = null;
  N.reserves = function () {
    // les magistrats des autres tribunaux d'abord : la liste ne doit pas dépendre du moment (tirage, ou chargement d'une partie)
    if (CR.GEN2 && CR.GEN2.creerActeurs) CR.GEN2.creerActeurs();
    if (reserves && reserves.n === (CR.ACTEURS || []).length) return reserves.set;
    const set = new Set(), civ = /^(Mme|M\.|Me|Capitaine|Lieutenant|Brigadier-chef|Brigadier|Adjudant|Commandant|Major)\s+/;
    const ajouter = (nm) => { if (!nm) return; const s = String(nm).replace(civ, "").trim(); const parts = s.split(" "); if (parts.length > 1) { set.add("nom:" + parts.slice(1).join(" ")); set.add(s); } };
    for (const a of CR.ACTEURS || []) ajouter(a.nom);
    if (CR.MENTOR) ajouter(CR.MENTOR.nom);
    for (const c of CR.COHORT || []) ajouter("x " + c.name);
    reserves = { n: (CR.ACTEURS || []).length, set };
    return set;
  };
  // Le genre d'un prénom de la banque : « m », « f », « e » (épicène) ou null
  let GENRE = null;
  N.genreDe = function (prenom) {
    if (!GENRE) { GENRE = new Map(); for (const k of ENS) for (const g of ["m", "f"]) for (const x of N.ENS[k][g]) GENRE.set(x[0], GENRE.has(x[0]) && GENRE.get(x[0]) !== g ? "e" : g); for (const x of N.EPI) GENRE.set(x[0], "e"); }
    return GENRE.get(prenom) || null;
  };
  // Les décennies où se donne un prénom (toutes listes confondues), pour les tests
  N.decenniesDe = function (prenom) {
    let a = 99, b = 0;
    for (const k of ENS) for (const g of ["m", "f"]) for (const x of N.ENS[k][g]) if (x[0] === prenom) { a = Math.min(a, x[1]); b = Math.max(b, x[2]); }
    for (const x of N.EPI) if (x[0] === prenom) { a = Math.min(a, x[1]); b = Math.max(b, x[2]); }
    return a <= b ? [a, b] : null;
  };
  // Nombre d'identités possibles (prénom × nom de famille), pour mesurer la banque
  N.identitesPossibles = function () {
    const id = new Set();
    let n = 0;
    for (const k of ENS) { const E = N.ENS[k], pr = new Set(E.m.concat(E.f).map((x) => x[0])); n += E.noms.length * pr.size; }
    const prTous = new Set(); for (const k of ENS) for (const g of ["m", "f"]) for (const x of N.ENS[k][g]) prTous.add(x[0]);
    const nomsTous = new Set(); for (const k of ENS) for (const x of N.ENS[k].noms) nomsTous.add(x);
    id.add(1);
    return { meme: n, mixte: prTous.size * nomsTous.size, prenoms: prTous.size, noms: nomsTous.size };
  };
  // ------------------------------------------------------------------ pour les pièces d'une affaire tirée (t)
  // pendant le tirage, la version est celle de la graine (CR.MONDE.vCour) ; ensuite, celle que l'affaire porte (t.ver)
  N.v5 = (t) => (((t && t.ver) || (CR.MONDE && CR.MONDE.vCour) || 0) >= 5);
  // les noms déjà portés dans l'affaire, et ceux des personnages récurrents : un inconnu n'en reçoit aucun
  // (seulement les personnes du tirage : celles qu'on ajoute en composant les pièces changeraient le résultat d'une
  // reconstruction à l'autre, et une sauvegarde rechargée ne redonnerait pas les mêmes noms)
  const TIRES = ["A", "V", "P", "T", "T2", "C2", "R", "D"];
  N.eviterDe = (t) => { const e = new Set(N.reserves()); for (const k of TIRES) { const P = t && t[k]; if (P && typeof P === "object" && P.prenom && P.nom) { e.add(P.prenom + " " + P.nom); e.add("nom:" + P.nom); } } return e; };
  // Un nom (« Prénom Nom ») pour une pièce : version 4, tiré dans l'ancienne liste exactement comme avant ; version 5, la source
  N.pour = function (t, r, ancienne, o = {}) {
    if (!N.v5(t)) return ancienne[Math.floor(r() * ancienne.length)];
    const P = N.personneSimple(r, { g: o.g, age: o.age || 28 + Math.floor(r() * 32), eviter: N.eviterDe(t) });
    return P.prenom + " " + P.nom;
  };
  // n noms distincts tirés d'une graine (version 5)
  N.liste = function (t, graine, n, o = {}) {
    const r = CR.seeded("noms:" + graine), e = N.eviterDe(t), out = [];
    for (let i = 0; i < n; i++) { const P = N.personneSimple(r, { g: o.g, age: (o.ages ? o.ages[0] + Math.floor(r() * (o.ages[1] - o.ages[0])) : 28 + Math.floor(r() * 32)), eviter: e }); e.add(P.prenom + " " + P.nom); e.add("nom:" + P.nom); out.push(P); }
    return out;
  };
  // le dossier vient-il d'une affaire tirée en version 5 (noms et visages de la 1.3.0) ?
  N.v5Dossier = (s, cs) => { const p = cs && s && (s.generated || []).find((x) => x.id === cs.id); return !!(p && p.t && N.v5(p.t)); };
  // Aucun inconnu d'une affaire nouvelle ne porte le nom de famille du joueur : il en prend un autre de son ensemble, et sa
  // famille avec lui (tous ceux qui portaient ce nom dans l'affaire) ; les textes déjà écrits dans l'affaire suivent.
  N.eloignerJoueur = function (t, joueur) {
    if (!N.v5(t) || !joueur || !joueur.nom) return;
    const X = String(joueur.nom).trim(); if (!X) return;
    const pers = []; const voir = (o, d) => { if (!o || typeof o !== "object" || d > 3) return; if (o.prenom && o.nom) pers.push(o); for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") voir(o[k], d + 1); };
    voir(t, 0);
    const touches = pers.filter((P) => P.nom === X || P.nomNaiss === X);
    if (!touches.length) return;
    // le nom tiré reste connu : la signature de l'affaire (graine de ses pièces, recalculée au chargement) s'en sert
    for (const P of touches) if (P.nom === X && P.nomTire == null) P.nomTire = X;
    const r = CR.seeded("eloigner:" + X + ":" + (t.sig || "")), ens = touches[0].ens || "france", e = N.eviterDe(t);
    let Y = X; for (let k = 0; k < 20 && (Y === X || e.has("nom:" + Y)); k++) Y = N.nom(r, ens, 1980);
    const re = new RegExp("(^|[^\\p{L}])" + X.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "gu");
    const remplacer = (o, d) => { if (!o || typeof o !== "object" || d > 6) return; for (const k of Object.keys(o)) { const v = o[k]; if ((d === 0 && (k === "sig" || k === "code")) || k === "nomTire") continue; /* la signature sert de graine : elle reste celle du tirage */ if (typeof v === "string") { if (v === X) o[k] = Y; else if (v.includes(X)) o[k] = v.replace(re, (m0, a) => a + Y); } else if (v && typeof v === "object") remplacer(v, d + 1); } };
    remplacer(t, 0);
  };
  // « e » si le prénom d'un nom complet est féminin (accords : « Je soussignée »)
  N.e = (nomComplet) => (N.genreDe(String(nomComplet).split(" ")[0]) === "f" ? "e" : "");
  // Un nom de personne seul (juré, policier, voisin, médecin), avec sa civilité
  N.personneSimple = function (r, o = {}) {
    const g = o.g || (r() < 0.5 ? "m" : "f"), age = o.age || 40, an = 2026 - age;
    const id = N.identite(r, { g, an, eviter: o.eviter });
    return Object.assign(id, { g, age, civ: g === "f" ? "Mme" : "M." });
  };
})();
