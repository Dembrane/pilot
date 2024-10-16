import React, { useState, useEffect } from "react";
import "./ParticipantOnboardingCards.css";

import {
  ChevronLeft,
  ChevronRight,
  Mic,
  MessageSquare,
  Users,
  Wifi,
  Volume2,
  Lock,
  Globe,
  DoorOpen,
  HelpCircle,
  Play,
  FileText,
  Smartphone,
  Laptop,
  BarChart,
  Server,
  Phone,
  PartyPopper,
  MessagesSquare,
  Group,
  Speech,
  Orbit,
  Route,
} from "lucide-react";
import { useLanguage } from "@/lib/useLanguage";
import { Button } from "@mantine/core";
import { PARTICIPANT_BASE_URL } from "@/config";
import { cn } from "@/lib/utils";
import { ParticipantInitiateForm } from "./ParticipantInitiateForm";

interface Slide {
  title: string;
  content?: string;
  icon: any;
  cta?: string;
  extraHelp?: string;
  checkbox?: {
    label: string;
    required: boolean;
  };
  link?: {
    label: string;
    url: string;
  };
  show?: boolean;
  component?: React.ReactNode;
}

interface Section {
  section: string;
  slides: Slide[];
}

export interface LanguageCards {
  [language: string]: Section[];
}

// const defaultCards: LanguageCards = {
//   "en-US": [
//     {
//       section: "Welcome",
//       slides: [
//         {
//           title: "Welcome to Dembrane!",
//           content: "Record your voice to answer questions and make an impact.",
//           icon: PartyPopper,
//           cta: "Let's go!",
//           extraHelp:
//             "This is a mini-tutorial. Use the previous and next buttons to navigate. Once completed, you'll enter the recording portal.",
//         },
//         {
//           title: "What is Dembrane?",
//           content:
//             "Dembrane helps people gather input from large groups easily.",
//           icon: Orbit,
//           cta: "Tell me more",
//           extraHelp:
//             "Whether it's feedback for a local municipality, input in a work setting, or participation in research, your voice matters!",
//         },
//         {
//           title: "Just Speak Your Mind",
//           content: "Answer questions in your own time by speaking or typing.",
//           icon: Speech,
//           cta: "Next",
//           extraHelp:
//             "Voice input is our primary mode, allowing for more natural and detailed responses. Typing is always available as a backup.",
//         },
//         {
//           title: "Solo or in a Group",
//           content: "Dembrane is more fun in groups!",
//           icon: MessagesSquare,
//           cta: "Next",
//           extraHelp:
//             "Dembrane is more fun when you find someone to discuss the questions together and record your conversation. We can't tell who said what, just what ideas were shared.",
//         },
//       ],
//     },
//     {
//       section: "How It Works",
//       slides: [
//         {
//           title: "Question Time",
//           content: "You'll recieve the questions once in the recording portal.",
//           icon: HelpCircle,
//           cta: "Got it",
//           extraHelp:
//             "Questions vary based on the host's needs. They could be about community issues, work experiences, or research topics. If there are no specific questions, you're free to share any thoughts or concerns.",
//         },
//         {
//           title: "Record When Ready",
//           content: "Start recording when you're ready to share.",
//           icon: Mic,
//           cta: "Understood",
//           extraHelp:
//             "Take your time to read questions, and feel free to stop and start as needed. For group discussions, it's often best to start recording after introductions for a more natural flow.",
//         },
//         {
//           title: "Your Voice's Journey",
//           content:
//             "We turn your recording into text to be analyzed by the host.",
//           icon: Route,
//           cta: "Next",
//           extraHelp:
//             "Transcripts help hosts identify patterns and insights across conversations. Your input contributes to better decision-making and research outcomes!",
//         },
//       ],
//     },
//     {
//       section: "Privacy",
//       slides: [
//         {
//           title: "Privacy Matters",
//           content: "As the recorder, you are in control of what you share.",
//           icon: Lock,
//           cta: "Tell me more",
//           extraHelp:
//             "Avoid sharing details you don't want the host to know. Be mindful and don't record others without their consent.",
//         },
//         {
//           title: "Data Usage & Security",
//           content:
//             "Your data is securely stored, analyzed, and never shared with third parties.",
//           icon: Server,
//           cta: "I understand",
//           extraHelp:
//             "Recordings are transcribed and analyzed for insights, then deleted after 30 days. For specific details, consult the host who provided your QR code.",
//           checkbox: {
//             label: "Lees het privacybeleidI agree to the privacy policy",
//             required: true,
//           },
//           link: {
//             label: "Read the full privacy policy",
//             url: "https://dembrane.notion.site/Privacy-statement-Dembrane-B-V-EN-uk-c014b987e8554a33b6b88a54d17bdab9",
//           },
//         },
//       ],
//     },
//     {
//       section: "Best Practices",
//       slides: [
//         {
//           title: "Strong Internet Connection",
//           content: "Ensure a stable connection for smooth recording.",
//           icon: Wifi,
//           cta: "Check",
//           extraHelp:
//             "Wi-Fi or good mobile data works best. If your connection drops, don't worry. You can always restart where you left off.",
//         },
//         {
//           title: "Reduce Background Noise",
//           content:
//             "Imagine Dembrane is on speakerphone with you. If you can hear yourself, you're good to go.",
//           icon: Volume2,
//           cta: "Noted",
//           extraHelp:
//             "Some background noise is okay, as long as who is speaking is clear.",
//         },
//         {
//           title: "Don't lock your device!",
//           content:
//             "Prevent interruptions by keeping your device unlocked. If it locks, just unlock and continue.",
//           icon: Smartphone,
//           cta: "Okay",
//           extraHelp:
//             "Dembrane tries to keep your device active, but sometimes devices can override it. You can adjust your device settings to stay unlocked longer if needed.",
//         },
//         {
//           title: "Supported Devices",
//           content:
//             "Dembrane works on most modern smartphones and browsers. Chrome, Firefox, and Safari are best supported.",
//           icon: Phone,
//           cta: "Got it",
//           extraHelp:
//             "Having trouble? Contact support at support@dembrane.com for assistance.",
//           show: false,
//         },
//       ],
//     },
//     {
//       section: "Get Started",
//       slides: [
//         {
//           title: "Ready to Begin?",
//           content: "Click 'Let's go!' And enter the recording portal.",
//           icon: Play,
//           link: {
//             label: "Let's go!",
//             url: "https://portal.dembrane.com",
//           },
//         },
//       ],
//     },
//   ],
//   "nl-NL": [
//     {
//       section: "Welkom",
//       slides: [
//         {
//           title: "Welkom bij Dembrane!",
//           content:
//             "Neem je stem op om vragen te beantwoorden en impact te maken.",
//           icon: PartyPopper,
//           cta: "Aan de slag!",
//           extraHelp:
//             "Dit is een mini-handleiding. Gebruik de knoppen om te navigeren. Na afloop kom je in de opnameportal terecht.",
//         },
//         {
//           title: "Wat is Dembrane?",
//           content:
//             "Dembrane helpt mensen gemakkelijk input van grote groepen te verzamelen.",
//           icon: Orbit,
//           cta: "Vertel me meer",
//           extraHelp:
//             "Of het nu gaat om feedback voor de gemeente, input op het werk, of deelname aan onderzoek, jouw stem telt!",
//         },
//         {
//           title: "Zeg het maar",
//           content:
//             "Beantwoord vragen in je eigen tempo door te spreken of te typen.",
//           icon: Speech,
//           cta: "Volgende",
//           extraHelp:
//             "Spraak is onze voorkeursmethode, omdat het natuurlijker en gedetailleerder is. Typen kan natuurlijk ook altijd.",
//         },
//         {
//           title: "Alleen of in een groep",
//           content: "Dembrane is leuker in groepen!",
//           icon: MessagesSquare,
//           cta: "Volgende",
//           extraHelp:
//             "Dembrane is leuker als je iemand vindt om de vragen samen te bespreken en jullie gesprek op te nemen. We kunnen niet horen wie wat zei, alleen welke ideeën er gedeeld zijn.",
//         },
//       ],
//     },
//     {
//       section: "Hoe het werkt",
//       slides: [
//         {
//           title: "Vragenronde",
//           content:
//             "Je krijgt de vragen te zien zodra je in de opnameportal bent.",
//           icon: HelpCircle,
//           cta: "Begrepen",
//           extraHelp:
//             "Vragen variëren afhankelijk van wat de organisator wil weten. Het kan gaan over de buurt, werkervaringen, of onderzoeksonderwerpen. Als er geen specifieke vragen zijn, kun je gewoon je gedachten of zorgen delen.",
//         },
//         {
//           title: "Opnemen wanneer je wilt",
//           content: "Start met opnemen als je er klaar voor bent.",
//           icon: Mic,
//           cta: "Duidelijk",
//           extraHelp:
//             "Neem rustig de tijd om de vragen te lezen en voel je vrij om te stoppen en opnieuw te beginnen wanneer je wilt. Bij groepsgesprekken is het vaak het beste om na de introducties te beginnen met opnemen voor een natuurlijker verloop.",
//         },
//         {
//           title: "De reis van je stem",
//           content:
//             "We zetten je opname om in tekst die door de organisator geanalyseerd wordt.",
//           icon: Route,
//           cta: "Volgende",
//           extraHelp:
//             "Transcripties helpen organisatoren patronen en inzichten te herkennen in verschillende gesprekken. Jouw input draagt bij aan betere besluitvorming en onderzoeksresultaten!",
//         },
//       ],
//     },
//     {
//       section: "Privacy",
//       slides: [
//         {
//           title: "Privacy is belangrijk",
//           content: "Als opnemer heb je zelf controle over wat je deelt.",
//           icon: Lock,
//           cta: "Vertel me meer",
//           extraHelp:
//             "Vermijd het delen van details die je niet met de organisator wilt delen. Wees voorzichtig en neem anderen niet op zonder hun toestemming.",
//         },
//         {
//           title: "Gegevensgebruik & Beveiliging",
//           content:
//             "Je gegevens worden veilig opgeslagen, geanalyseerd en nooit gedeeld met derden.",
//           icon: Server,
//           cta: "Ik begrijp het",
//           extraHelp:
//             "Opnames worden getranscribeerd en geanalyseerd voor inzichten, en na 30 dagen verwijderd. Voor specifieke details, raadpleeg de organisator die je de QR-code heeft gegeven.",
//           checkbox: {
//             label: "Ik ga akkoord met het privacybeleid",
//             required: true,
//           },
//           link: {
//             label: "Lees het privacybeleid",
//             url: "https://dembrane.notion.site/Privacyverklaring-Dembrane-B-V-NL-9d994cb67f2a4d0ba10982c537f930e1",
//           },
//         },
//       ],
//     },
//     {
//       section: "Tips",
//       slides: [
//         {
//           title: "Goede internetverbinding",
//           content: "Zorg voor een stabiele verbinding voor een soepele opname.",
//           icon: Wifi,
//           cta: "Check",
//           extraHelp:
//             "Wi-Fi of een goede mobiele verbinding werkt het beste. Valt je verbinding weg? Geen zorgen, je kunt altijd opnieuw beginnen waar je gebleven was.",
//         },
//         {
//           title: "Verminder achtergrondgeluid",
//           content:
//             "Stel je voor dat Dembrane via de luidspreker met je praat. Als je jezelf kunt horen, zit je goed.",
//           icon: Volume2,
//           cta: "Begrepen",
//           extraHelp:
//             "Een beetje achtergrondgeluid is geen probleem, zolang duidelijk is wie er spreekt.",
//         },
//         {
//           title: "Vergrendel je apparaat niet!",
//           content:
//             "Voorkom onderbrekingen door je apparaat ontgrendeld te houden. Als het toch vergrendelt, ontgrendel je het gewoon en ga je verder.",
//           icon: Smartphone,
//           cta: "Oké",
//           extraHelp:
//             "Dembrane probeert je apparaat actief te houden, maar soms kunnen apparaten dit overrulen. Je kunt de instellingen van je apparaat aanpassen om langer ontgrendeld te blijven als dat nodig is.",
//         },
//         {
//           title: "Ondersteunde apparaten",
//           content:
//             "Dembrane werkt op de meeste moderne smartphones en browsers. Chrome, Firefox en Safari worden het beste ondersteund.",
//           icon: Phone,
//           cta: "Begrepen",
//           extraHelp:
//             "Problemen? Neem contact op met support@dembrane.com voor hulp.",
//           show: false,
//         },
//       ],
//     },
//     {
//       section: "Aan de slag",
//       slides: [
//         {
//           title: "Klaar om te beginnen?",
//           content: "Klik op 'Aan de slag!' en ga naar de opnameportal.",
//           icon: Play,
//           link: {
//             label: "Aan de slag!",
//             url: "https://portal.dembrane.com",
//           },
//         },
//       ],
//     },
//   ],
// };

const ParticipantOnboardingCards = ({
  project,
  initialCards,
}: {
  project: Project;
  initialCards: LanguageCards;
}) => {
  const cards: LanguageCards = {
    ...initialCards,
    "en-US": [
      ...initialCards["en-US"],
      {
        section: "Get Started",
        slides: [
          {
            title: "Ready to Begin?",
            icon: Play,
            component: <ParticipantInitiateForm project={project} />,
          },
        ],
      },
    ],
    "nl-NL": [
      ...initialCards["nl-NL"],
      {
        section: "Aan de slag",
        slides: [
          {
            title: "Klaar om te beginnen?",
            icon: Play,
            component: <ParticipantInitiateForm project={project} />,
          },
        ],
      },
    ],
  };

  const [currentSection, setCurrentSection] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>(
    {},
  );
  const [animationDirection, setAnimationDirection] = useState("");

  const { language } = useLanguage();

  // Add this check to ensure we have valid data
  const languageCards = cards[language as keyof typeof cards] || [];
  const currentSectionCards = languageCards[currentSection] || { slides: [] };
  const currentCard = currentSectionCards.slides[currentSlide];

  // If there's no valid card, render a fallback
  if (!currentCard) {
    return <div>No card available for the current language and section.</div>;
  }

  const nextSlide = () => {
    if (
      currentCard.checkbox?.required &&
      !checkboxStates[`${currentSection}-${currentSlide}`]
    ) {
      return;
    }
    setAnimationDirection("slide-left");
    if (currentSlide < currentSectionCards.slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (currentSection < languageCards.length - 1) {
      setCurrentSection((prev) => prev + 1);
      setCurrentSlide(0);
    }
  };

  const isLastSlide =
    currentSection === languageCards.length - 1 &&
    currentSlide === currentSectionCards.slides.length - 1;

  const prevSlide = () => {
    setAnimationDirection("slide-right");
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      setCurrentSlide(
        languageCards[currentSection - 1]?.slides.length - 1 || 0,
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimationDirection(""), 300);
    return () => clearTimeout(timer);
  }, [currentSection, currentSlide]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxStates((prev) => ({
      ...prev,
      [`${currentSection}-${currentSlide}`]: event.target.checked,
    }));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-2 text-xl">{currentSectionCards.section}</div>
      <div
        className={cn(
          `flex flex-grow flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow ${animationDirection}`,
          currentCard.component && "w-full px-6 py-8",
        )}
      >
        <div
          className={cn(
            "mb-8 transform transition-all duration-300 ease-in-out hover:scale-110",
            currentCard.component && "mb-4",
          )}
        >
          {React.createElement(currentCard.icon, {
            size: 64,
            className: "text-blue-500",
          })}
        </div>

        <h2
          className={cn(
            "mb-4 text-3xl text-gray-800",
            currentCard.component && "text-2xl",
          )}
        >
          {currentCard.title}
        </h2>

        {currentCard.content && (
          <p className="text-xl text-gray-600">{currentCard.content}</p>
        )}

        {currentCard.extraHelp && (
          <p className="mt-4 text-sm text-gray-500">{currentCard.extraHelp}</p>
        )}

        <div className="w-full text-left">{currentCard.component}</div>

        {currentCard.link && (
          <Button
            component="a"
            target={
              currentCard.link.url.startsWith(PARTICIPANT_BASE_URL) ||
              currentCard.link.url.startsWith("/")
                ? "_self"
                : "_blank"
            }
            href={currentCard.link.url}
            className="mt-4"
            size={currentCard.cta ? "md" : "lg"}
            variant={currentCard.cta ? "transparent" : "filled"}
          >
            {currentCard.link.label}
          </Button>
        )}

        {currentCard.checkbox && (
          <div className="mt-4 flex items-center justify-center">
            <input
              type="checkbox"
              id={`checkbox-${currentSection}-${currentSlide}`}
              checked={
                checkboxStates[`${currentSection}-${currentSlide}`] || false
              }
              onChange={handleCheckboxChange}
              className="mr-2 h-5 w-5 text-blue-500"
            />
            <label
              htmlFor={`checkbox-${currentSection}-${currentSlide}`}
              className="text-lg text-gray-700"
            >
              {currentCard.checkbox.label}
            </label>
          </div>
        )}
      </div>

      {currentCard.cta && (
        <Button
          onClick={nextSlide}
          size="lg"
          disabled={
            isLastSlide ||
            (currentCard.checkbox?.required &&
              !checkboxStates[`${currentSection}-${currentSlide}`])
          }
          className="mt-8"
        >
          {currentCard.cta}
        </Button>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={prevSlide}
          disabled={currentSection === 0 && currentSlide === 0}
          className={`rounded-full p-2 transition-colors duration-200 ${
            currentSection === 0 && currentSlide === 0
              ? "text-gray-300"
              : "text-blue-500 hover:bg-blue-100"
          }`}
        >
          <ChevronLeft size={32} />
        </button>
        <div className="flex space-x-2">
          {languageCards.flatMap((section, sIndex) =>
            section.slides.map((_, slideIndex) => (
              <div
                key={`${sIndex}-${slideIndex}`}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  sIndex === currentSection && slideIndex === currentSlide
                    ? "w-4 bg-blue-500"
                    : "bg-gray-300"
                }`}
              ></div>
            )),
          )}
        </div>
        <button
          onClick={nextSlide}
          disabled={
            isLastSlide ||
            (currentCard.checkbox?.required &&
              !checkboxStates[`${currentSection}-${currentSlide}`])
          }
          className={`rounded-full p-2 transition-colors duration-200 ${
            isLastSlide ||
            (currentCard.checkbox?.required &&
              !checkboxStates[`${currentSection}-${currentSlide}`])
              ? "text-gray-300"
              : "text-blue-500 hover:bg-blue-100"
          }`}
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default ParticipantOnboardingCards;
