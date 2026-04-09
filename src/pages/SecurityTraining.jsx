
import React, { useState, useEffect, Suspense, lazy, useCallback, memo, useMemo } from "react";
import { User } from "@/entities/User";
import { TrainingProgress } from "@/entities/TrainingProgress";
import { TrainingVideo } from '@/entities/TrainingVideo';
import { TrainingBadge } from "@/entities/TrainingBadge";
import { ThreatAdvisory } from "@/entities/ThreatAdvisory";
import { Assessment } from "@/entities/Assessment";
import { Company } from "@/entities/Company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Shield,
  Users,
  Lock,
  Eye,
  CheckCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Award,
  Clock,
  Target,
  Loader2,
  Code,
  Cloud,
  KeyRound,
  Network,
  Bug,
  UserCircle,
  AlertTriangle,
  AlertCircle,
  Trophy
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CachedEntityManager } from "@/components/utils/networkUtils";

// Lazy load the VideoPlayer component
const VideoPlayer = lazy(() => import('../components/training/VideoPlayer'));

export default function SecurityTraining() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [company, setCompany] = useState(null);

  // Role selection state
  const [selectedRoleType, setSelectedRoleType] = useState('general');
  const [savingRoleType, setSavingRoleType] = useState(false);

  // Training state - now backed by database
  const [userProgress, setUserProgress] = useState({});
  const [currentTraining, setCurrentTraining] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState([]);
  const [savingProgress, setSavingProgress] = useState(false);

  // NEW: State for personalized content
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [recentThreats, setRecentThreats] = useState([]);
  const [badges, setBadges] = useState([]);

  // NEW: Quick progress summary (derived state)
  const completedCount = Object.values(userProgress || {}).filter(p => p?.completed).length;
  const avgScore = useMemo(() => {
    const scores = Object.values(userProgress || {})
      .map(p => typeof p?.quiz_score === 'number' ? p.quiz_score : null)
      .filter(v => v !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [userProgress]);

  // Expanded training modules with content tailored for different roles
  // Wrap training modules in useMemo to keep reference stable across renders
  const allTrainingModules = useMemo(() => [
    // General User Training Modules
    {
      id: 'phishing-awareness',
      icon: BookOpen,
      title: "Phishing Awareness",
      description: "Learn to identify and report sophisticated phishing attempts and social engineering attacks.",
      difficulty: "Beginner",
      duration: "35 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Modern Phishing Landscape",
            content: "Today's phishing attacks have evolved far beyond simple email scams. Attackers now use sophisticated techniques including deepfakes, AI-generated content, and multi-channel approaches combining email, SMS, voice calls, and social media.",
            image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Business Email Compromise (BEC): Attackers impersonate executives or vendors using spoofed domains like 'arnazon.com' instead of 'amazon.com', often requesting urgent wire transfers",
              "Spear Phishing with Open Source Intelligence (OSINT): Attackers research targets on LinkedIn and social media to craft highly personalized messages referencing recent projects, colleagues, or company news",
              "Smishing and Vishing: SMS phishing ('Your package is delayed, click here') and voice phishing calls ('This is your bank's fraud department') that bypass email security controls",
              "Quishing (QR Code Phishing): Malicious QR codes in emails or physical locations that bypass link scanning and redirect to credential theft sites",
              "AI-generated phishing emails that pass traditional detection systems by using natural language processing to create contextually relevant, grammatically perfect messages"
            ]
          },
          {
            title: "Advanced Detection Techniques",
            content: "Modern phishing detection requires understanding both technical indicators and psychological manipulation tactics used by sophisticated threat actors.",
            image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Domain analysis: Check for homograph attacks using Unicode characters (e.g., 'goog1e.com' using the number 1 instead of 'l')",
              "Email header inspection: Look for SPF, DKIM, and DMARC failures in security headers",
              "Urgency and authority exploitation: Be suspicious of time pressure ('Your account expires in 2 hours') combined with authority figures ('CEO needs this immediately')",
              "Link analysis: Hover over links to see actual destinations, look for URL shorteners or suspicious domains",
              "Attachment scrutiny: Be wary of password-protected archives, macro-enabled documents, or executable files disguised as PDFs",
              "Social proof manipulation: Messages claiming 'Everyone in your department has already completed this' or referencing recent company events",
              "Multi-channel validation: If an email request seems urgent, verify through a separate communication channel (phone call, in-person, different messaging system)"
            ]
          },
          {
            title: "Incident Response for Phishing",
            content: "When you suspect a phishing attempt or realize you may have been compromised, immediate action can prevent escalation to a major security incident.",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Immediate isolation: If you clicked a link or downloaded an attachment, disconnect from the network immediately to prevent lateral movement",
              "Credential security: If you entered credentials anywhere, change your passwords immediately and enable MFA if not already active",
              "Email reporting: Forward the suspicious email to your IT security team and any anti-phishing reporting system",
              "Browser security: Clear browser cache, cookies, and check for unexpected browser extensions or homepage changes",
              "System scan: Run a full antivirus scan and check for new programs or services running on your system",
              "Timeline documentation: Note exactly what you clicked, when, and what information you may have entered",
              "Network monitoring: IT should monitor your user account and workstation for unusual network activity or data exfiltration attempts",
              "Stakeholder notification: Inform your manager and any affected business units if sensitive information may have been compromised"
            ]
          }
        ],
        quiz: [
          {
            question: "What makes modern Business Email Compromise (BEC) attacks particularly dangerous?",
            options: ["They use malware attachments", "They impersonate trusted executives and vendors using research from social media", "They only target technical users", "They are always detected by email filters"],
            correct: 1
          },
          {
            question: "What is a 'homograph attack' in the context of phishing?",
            options: ["Using the same message across multiple platforms", "Using similar-looking Unicode characters to create fake domains", "Sending identical emails to many recipients", "Using graphics instead of text in emails"],
            correct: 1
          },
          {
            question: "If you realize you may have fallen for a phishing attack, what should be your FIRST action?",
            options: ["Run an antivirus scan", "Change your password", "Disconnect from the network", "Report to IT"],
            correct: 2
          },
          {
            question: "What is 'quishing'?",
            options: ["Quick phishing attacks", "QR code phishing", "Quiet phishing methods", "Question-based phishing"],
            correct: 1
          },
          {
            question: "Why are AI-generated phishing emails becoming more dangerous?",
            options: ["They contain malware", "They bypass email security with perfect grammar and context", "They target specific individuals only", "They use advanced encryption"],
            correct: 1
          },
          {
            question: "What should you do if you receive an urgent email request that claims to be from your CEO?",
            options: ["Respond immediately to show you're responsive", "Forward it to the entire team", "Verify through a separate communication channel", "Wait until the next day to respond"],
            correct: 2
          }
        ]
      }
    },
    {
      id: 'password-security',
      icon: Lock,
      title: "Password Security",
      description: "Master password best practices, multi-factor authentication, and credential management.",
      difficulty: "Beginner",
      duration: "25 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Password Fundamentals",
            content: "Strong passwords are your first line of defense against unauthorized access to your accounts and company systems.",
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Weak password: 'password123' - common word with predictable numbers",
              "Better password: 'MyD0g!sC@ll3dMax' - mix of personal info with special characters",
              "Best approach: Use a password manager to generate unique, complex passwords like 'Kj9#mL2$vN8@pQ5&'"
            ]
          },
          {
            title: "Multi-Factor Authentication",
            content: "MFA adds an extra security layer beyond just passwords, making it much harder for attackers to access your accounts.",
            image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Enable MFA on all work accounts (email, cloud services, business applications)",
              "Use authenticator apps like Google Authenticator or Microsoft Authenticator instead of SMS when possible",
              "Keep backup codes in a secure location in case you lose access to your device",
              "Never share MFA codes with anyone - legitimate services will never ask for them",
              "Report lost or stolen MFA devices to IT immediately"
            ]
          },
          {
            title: "Password Manager Best Practices",
            content: "Password managers help you use unique, strong passwords for every account without having to remember them all.",
            image: "https://images.unsplash.com/photo-1555949963-ff9fe19c493d?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Install a reputable password manager (1Password, Bitwarden, LastPass, or Dashlane)",
              "Use a strong, memorable master password that you don't use anywhere else",
              "Enable MFA on your password manager account for extra security",
              "Let the password manager generate unique passwords for each account",
              "Regularly audit and update old or weak passwords",
              "Never store passwords in browsers on shared computers",
              "Share company account credentials only through secure password manager sharing features"
            ]
          }
        ],
        quiz: [
          {
            question: "What makes a password strong?",
            options: ["It contains your name and birthday", "It's at least 12 characters with mixed case, numbers, and symbols", "It's easy to remember and type", "It's the same across all accounts for consistency"],
            correct: 1
          },
          {
            question: "What is multi-factor authentication (MFA)?",
            options: ["Using multiple passwords", "An extra security step beyond passwords", "A way to remember passwords", "A type of password manager"],
            correct: 1
          },
          {
            question: "Which is the most secure method for MFA?",
            options: ["SMS text messages", "Email codes", "Authenticator apps", "Security questions"],
            correct: 2
          },
          {
            question: "What should you do if you lose your MFA device?",
            options: ["Wait until you can buy a replacement", "Use backup codes and report to IT immediately", "Ask a colleague to share their codes", "Disable MFA temporarily"],
            correct: 1
          },
          {
            question: "What is the main benefit of using a password manager?",
            options: ["It makes all passwords the same", "It allows unique, strong passwords for every account", "It eliminates the need for MFA", "It stores passwords in the browser"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'social-engineering',
      icon: Users,
      title: "Social Engineering Awareness",
      description: "Recognize and defend against manipulation tactics used by cybercriminals.",
      difficulty: "Intermediate",
      duration: "35 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Understanding Social Engineering",
            content: "Social engineering exploits human psychology rather than technical vulnerabilities to gain unauthorized access to systems or information.",
            image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Phone calls claiming to be from IT asking for your password to 'fix' your account",
              "Fake LinkedIn invitations from 'recruiters' trying to gather company information",
              "Tailgating - someone following you into a secure building without badging in"
            ]
          },
          {
            title: "Common Attack Vectors",
            content: "Learn to identify the most frequent social engineering tactics used against organizations:",
            image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Pretexting: Creating fake scenarios to extract information ('I'm from the bank...', 'This is IT support...')",
              "Baiting: Offering something enticing to trigger curiosity (USB drives, free downloads)",
              "Quid pro quo: Offering a service in exchange for information ('I'll fix your computer if...')",
              "Authority: Impersonating someone in power to pressure compliance ('Your CEO needs this immediately')",
              "Urgency: Creating false time pressure to bypass normal security procedures",
              "Familiarity: Pretending to know you or referencing mutual connections"
            ]
          },
          {
            title: "Defense Strategies",
            content: "Protect yourself and your organization with these defensive practices:",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Verify identity through official channels before sharing any information",
              "Be suspicious of unsolicited contact, especially with urgent requests",
              "Never provide sensitive information over the phone unless you initiated the call",
              "Report suspicious approaches to your security team immediately",
              "Follow the 'trust but verify' principle - even with people you think you know",
              "Be cautious about sharing work information on social media",
              "Challenge unfamiliar people in secure areas politely but firmly"
            ]
          }
        ],
        quiz: [
          {
            question: "What is social engineering in cybersecurity?",
            options: ["A technical hacking method", "Manipulating people to reveal information or access", "A type of software vulnerability", "Network configuration management"],
            correct: 1
          },
          {
            question: "Someone calls claiming to be from IT and asks for your password to fix an urgent issue. What should you do?",
            options: ["Give them the password to resolve the issue quickly", "Ask for their employee ID number", "Hang up and contact IT through official channels", "Ask them to call back later"],
            correct: 2
          },
          {
            question: "What is 'tailgating' in security terms?",
            options: ["Following someone's car too closely", "Monitoring network traffic", "Following someone into a secure area without proper access", "Copying someone's work"],
            correct: 2
          },
          {
            question: "Which of these is a red flag for a social engineering attempt?",
            options: ["A request through normal company channels", "Someone creating urgent pressure for immediate action", "A colleague asking about weekend plans", "A routine security training email"],
            correct: 1
          },
          {
            question: "How should you handle an unsolicited LinkedIn invitation from someone claiming to be a recruiter?",
            options: ["Accept immediately to explore opportunities", "Verify their identity and company before connecting", "Share your resume right away", "Ask for your colleagues' contact information"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'data-handling',
      icon: KeyRound,
      title: "Secure Data Handling",
      description: "Learn best practices for protecting sensitive company and customer data.",
      difficulty: "Beginner",
      duration: "20 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Data Classification",
            content: "Understanding how to classify data (Public, Internal, Confidential, Restricted) is the first step to protecting it appropriately.",
            image: "https://images.unsplash.com/photo-1549642194-e3562a0352ef?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Identify sensitive data types: PII, financial, intellectual property, health records",
              "Understand data classification labels: Public, Internal, Confidential, Restricted",
              "Apply classification consistently across all data assets",
              "Review data classification regularly as business needs evolve"
            ]
          },
          {
            title: "Secure Storage & Sharing",
            content: "Once data is classified, ensure it's stored and shared using approved, secure methods.",
            image: "https://images.unsplash.com/photo-1520697960337-12d8a07c3319?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Only use company-approved storage solutions with appropriate security controls",
              "Avoid storing sensitive data on local hard drives or unencrypted USB sticks",
              "Use secure file transfer protocols or encrypted email for sharing sensitive documents",
              "Never share login credentials for shared drives or cloud accounts"
            ]
          }
        ],
        quiz: [
          {
            question: "Which of the following is considered 'sensitive data' that requires special protection?",
            options: ["Company's public marketing brochure", "Employee's home address and social security number", "A recipe for the office potluck", "The weather forecast for next week"],
            correct: 1
          },
          {
            question: "What is the best way to share a highly confidential document with a colleague?",
            options: ["Attach it to a regular, unencrypted email", "Upload it to your personal cloud drive and send a link", "Use a company-approved secure file transfer system", "Print it out and leave it on their desk"],
            correct: 2
          }
        ]
      }
    },
    {
      id: 'remote-work-security',
      icon: Shield,
      title: "Remote Work Security",
      description: "Essential security practices for working safely from home or remote locations.",
      difficulty: "Beginner",
      duration: "25 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Securing Your Home Office",
            content: "Creating a secure workspace at home requires attention to both physical and digital security measures.",
            image: "https://images.unsplash.com/photo-1583953421018-57281b7e2fe9?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Position your screen away from windows and visitors to prevent shoulder surfing",
              "Use a privacy screen filter when working in public or shared spaces",
              "Lock your devices when stepping away, even at home",
              "Store company devices securely when not in use",
              "Ensure confidential calls cannot be overheard by family members or neighbors"
            ]
          },
          {
            title: "Network Security at Home",
            content: "Your home network is now part of your company's extended perimeter and needs proper security.",
            image: "https://images.unsplash.com/photo-1606868306217-dbf5046868d2?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Always use company VPN when accessing work systems from home",
              "Change default passwords on your home router and enable WPA3 encryption",
              "Keep your home router firmware updated regularly",
              "Set up a separate guest network for visitors and IoT devices",
              "Avoid using public Wi-Fi for work activities - use mobile hotspot if needed",
              "Enable automatic security updates on all your home devices"
            ]
          }
        ],
        quiz: [
          {
            question: "What should you do before stepping away from your computer while working from home?",
            options: ["Nothing, since you're at home", "Close all applications", "Lock your screen", "Turn off the computer"],
            correct: 2
          },
          {
            question: "Which network should you use for work activities when at a coffee shop?",
            options: ["The coffee shop's free Wi-Fi", "Your mobile hotspot with VPN", "Any available Wi-Fi network", "The coffee shop's premium Wi-Fi"],
            correct: 1
          },
          {
            question: "What's the best practice for taking confidential work calls from home?",
            options: ["Take calls anywhere at home", "Ensure calls cannot be overheard by others", "Only take calls in the basement", "Always use speaker phone"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'ransomware-awareness',
      icon: AlertTriangle,
      title: "Ransomware Awareness & Prevention",
      description: "Understand ransomware threats and learn how to prevent and respond to attacks.",
      difficulty: "Intermediate",
      duration: "30 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "What is Ransomware?",
            content: "Ransomware is malicious software that encrypts files and demands payment for decryption keys. It's one of the most dangerous threats facing organizations today.",
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop&auto=format",
            examples: [
              "WannaCry (2017): Affected over 300,000 computers worldwide, exploiting Windows vulnerabilities",
              "NotPetya (2017): Initially targeted Ukraine but spread globally, causing billions in damages",
              "Colonial Pipeline (2021): DarkSide ransomware shut down major US fuel pipeline for days"
            ]
          },
          {
            title: "How Ransomware Spreads",
            content: "Understanding common attack vectors helps you recognize and prevent ransomware infections.",
            image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Phishing emails with malicious attachments or links",
              "Compromised websites and malicious advertisements (malvertising)",
              "USB drives and removable media containing infected files",
              "Remote Desktop Protocol (RDP) attacks on poorly secured systems",
              "Supply chain attacks through compromised software updates",
              "Network propagation from initially infected machines"
            ]
          },
          {
            title: "Prevention and Response",
            content: "The best defense against ransomware combines prevention, preparation, and proper incident response.",
            image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Never open suspicious email attachments or click unknown links",
              "Keep all software and systems updated with latest security patches",
              "Maintain regular, tested backups stored offline or in immutable storage",
              "If infected, immediately disconnect from network to prevent spread",
              "Never pay ransom - there's no guarantee files will be recovered",
              "Report ransomware incidents to IT and law enforcement immediately",
              "Test your backup and recovery procedures regularly"
            ]
          }
        ],
        quiz: [
          {
            question: "What should you do if you suspect your computer is infected with ransomware?",
            options: ["Try to remove it yourself", "Immediately disconnect from the network", "Restart your computer", "Continue working and hope it goes away"],
            correct: 1
          },
          {
            question: "Should you pay the ransom if your files are encrypted?",
            options: ["Yes, it's the fastest way to get files back", "Only if the amount is small", "No, there's no guarantee of file recovery", "Only if IT approves it"],
            correct: 2
          },
          {
            question: "What's the most important prevention measure against ransomware?",
            options: ["Installing antivirus software", "Regular, tested backups", "Using strong passwords", "Avoiding email entirely"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'physical-security',
      icon: Eye,
      title: "Physical Security Awareness",
      description: "Protect physical assets and prevent unauthorized access to facilities and devices.",
      difficulty: "Beginner",
      duration: "20 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Workplace Physical Security",
            content: "Physical security is often overlooked but is crucial for protecting sensitive information and assets.",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Always wear your ID badge visibly and challenge unfamiliar people",
              "Never prop open secure doors or let unauthorized people tailgate",
              "Lock your computer screen when stepping away from your desk",
              "Keep sensitive documents secured and out of view",
              "Report suspicious individuals or activities to security immediately"
            ]
          },
          {
            title: "Device Security",
            content: "Company devices contain valuable data and must be protected both in the office and during travel.",
            image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Never leave laptops, phones, or tablets unattended in public spaces",
              "Use cable locks when working in shared areas or conferences",
              "Enable device encryption and remote wipe capabilities",
              "Store backup media and sensitive documents in locked drawers or cabinets",
              "Report lost or stolen devices to IT and security immediately",
              "Properly dispose of sensitive documents using designated shredders"
            ]
          }
        ],
        quiz: [
          {
            question: "What should you do if someone you don't recognize asks to follow you into a secure area?",
            options: ["Let them in if they seem legitimate", "Politely ask them to use their own access card", "Ignore them and keep walking", "Call security immediately"],
            correct: 1
          },
          {
            question: "When is it acceptable to leave your laptop unattended in a coffee shop?",
            options: ["When you can see it from the bathroom", "If you're only gone for 2 minutes", "Never - always take it with you", "If you ask someone to watch it"],
            correct: 2
          },
          {
            question: "What is the primary purpose of a privacy screen filter?",
            options: ["To reduce glare", "To protect the screen from scratches", "To prevent visual hacking (shoulder surfing)", "To enhance screen colors"],
            correct: 2
          }
        ]
      }
    },
    {
      id: 'incident-reporting',
      icon: AlertCircle,
      title: "Security Incident Reporting",
      description: "Learn how to recognize and properly report security incidents to minimize damage.",
      difficulty: "Beginner",
      duration: "15 min",
      department: "all",
      type: "interactive",
      target_audience: 'general',
      content: {
        sections: [
          {
            title: "Recognizing Security Incidents",
            content: "Early detection and reporting of security incidents is crucial for minimizing damage and recovery time.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Unusual computer behavior: slow performance, unexpected pop-ups, or programs starting automatically",
              "Suspicious network activity: unexpected data transfers or network connections",
              "Unauthorized access attempts: failed login notifications or accounts being accessed from unusual locations",
              "Missing or tampered equipment: devices, documents, or access cards that are unaccounted for"
            ]
          },
          {
            title: "Proper Reporting Procedures",
            content: "Knowing how and when to report incidents ensures the fastest possible response from your security team.",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Report incidents immediately - don't wait to be certain something is wrong",
              "Use designated reporting channels: security hotline, IT helpdesk, or incident response team",
              "Preserve evidence: don't try to 'fix' things yourself before reporting",
              "Document what you observed: time, location, and specific details of the incident",
              "Follow up to ensure your report was received and acted upon",
              "Cooperate fully with investigation teams and provide additional information as requested"
            ]
          }
        ],
        quiz: [
          {
            question: "When should you report a suspected security incident?",
            options: ["Only when you're absolutely certain", "After trying to fix it yourself", "Immediately upon suspicion", "At the end of the work day"],
            correct: 2
          },
          {
            question: "What should you do if you accidentally click on a suspicious email link?",
            options: ["Nothing if nothing obvious happens", "Report it to IT immediately", "Run a virus scan first", "Wait to see if problems develop"],
            correct: 1
          }
        ]
      }
    },
    // Engineering & DevOps Training Modules
    {
      id: 'secure-code-owasp',
      icon: Code,
      title: "Secure Code Development (OWASP Top 10 2021)",
      description: "Master the OWASP Top 10 2021 vulnerabilities and implement secure coding practices using modern frameworks and tools.",
      difficulty: "Advanced",
      duration: "90 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "OWASP Top 10 2021: What's New and Critical",
            content: "The OWASP Top 10 2021 reflects the current threat landscape with three new categories and updated focus on modern application architectures including APIs, cloud-native applications, and supply chain security.",
            image: "https://images.unsplash.com/photo-1621609764035-f5076e737976?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "A01: Broken Access Control - Now #1 risk, affecting 94% of applications tested",
              "A02: Cryptographic Failures - Evolved from 'Sensitive Data Exposure' with focus on crypto failures",
              "A03: Injection - Still critical but dropped from #1 due to improved frameworks and awareness",
              "A04: Insecure Design - NEW: Focuses on risks from flawed design and architecture",
              "A05: Security Misconfiguration - Expanded to include cloud misconfigurations and container security",
              "A06: Vulnerable and Outdated Components - Emphasizes supply chain risk management",
              "A07: Identification and Authentication Failures - Critical for zero-trust architectures",
              "A08: Software and Data Integrity Failures - NEW: Addresses supply chain attacks like SolarWinds",
              "A09: Security Logging and Monitoring Failures - Essential for incident response and compliance",
              "A10: Server-Side Request Forgery (SSRF) - NEW: Critical in cloud and microservices environments"
            ]
          },
          {
            title: "Modern Secure Coding Practices",
            content: "Implementing security-by-design using modern frameworks, automated security testing, and DevSecOps practices to address contemporary threat vectors.",
            image: "https://images.unsplash.com/photo-1627993214810-7e3e060c4103?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement parameterized queries and ORM frameworks (Hibernate, Entity Framework, SQLAlchemy) to prevent injection attacks",
              "Use secure authentication libraries (OAuth 2.1, OpenID Connect, SAML 2.0) rather than building custom authentication",
              "Implement proper input validation using allow-lists, data type validation, and length restrictions at all trust boundaries",
              "Apply the principle of least privilege with role-based access control (RBAC) and attribute-based access control (ABAC)",
              "Use secure cryptographic libraries (libsodium, Bouncy Castle) and avoid deprecated algorithms (MD5, SHA1, DES)",
              "Implement Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and other security headers",
              "Use static application security testing (SAST) tools like SonarQube, CodeQL, or Veracode in CI/CD pipelines",
              "Implement dynamic application security testing (DAST) with tools like OWASP ZAP or Burp Suite Professional",
              "Use software composition analysis (SCA) tools like Snyk, WhiteSource, or FOSSA to scan dependencies",
              "Apply secure design patterns: input validation, output encoding, error handling, and secure session management"
            ]
          },
          {
            title: "API Security and Modern Architecture",
            content: "Securing modern application architectures including RESTful APIs, GraphQL, microservices, and serverless functions using the OWASP API Security Top 10.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            examples: [
              "API1: Broken Object Level Authorization - Implement proper authorization checks for every API endpoint accessing user data",
              "API2: Broken User Authentication - Use OAuth 2.1 with PKCE, JWT with proper validation, and multi-factor authentication",
              "API3: Excessive Data Exposure - Implement response filtering and avoid exposing internal object structures",
              "API4: Lack of Resources & Rate Limiting - Implement rate limiting, pagination, and resource quotas using tools like Redis",
              "API5: Broken Function Level Authorization - Verify user permissions for each function call, not just object access",
              "API6: Mass Assignment - Use DTOs, allow-lists, and input validation to prevent mass assignment vulnerabilities",
              "API7: Security Misconfiguration - Secure headers, disable debug modes, use HTTPS, implement CORS policies properly",
              "API8: Injection - Sanitize inputs for SQL, NoSQL, LDAP, and OS command injection in API endpoints",
              "API9: Improper Assets Management - Maintain API inventory, version control, and retire old API versions securely",
              "API10: Insufficient Logging & Monitoring - Log authentication events, authorization failures, and suspicious patterns"
            ]
          }
        ],
        quiz: [
          {
            question: "What is the #1 vulnerability in OWASP Top 10 2021 and why did it move to the top?",
            options: ["Injection, because it's still the most common", "Broken Access Control, because it was found in 94% of tested applications", "Cryptographic Failures, because of poor encryption", "Security Misconfiguration, because of cloud adoption"],
            correct: 1
          },
          {
            question: "Which OWASP Top 10 2021 category addresses supply chain attacks like SolarWinds?",
            options: ["Vulnerable and Outdated Components", "Software and Data Integrity Failures", "Insecure Design", "Security Misconfiguration"],
            correct: 1
          },
          {
            question: "What is the most effective way to prevent SQL injection in modern applications?",
            options: ["Input sanitization with blacklists", "Using parameterized queries/prepared statements with ORM frameworks", "Web application firewalls only", "Regular expression validation"],
            correct: 1
          },
          {
            question: "According to OWASP API Security Top 10, what is API1 (the top API vulnerability)?",
            options: ["Broken User Authentication", "Injection", "Broken Object Level Authorization", "Rate Limiting Issues"],
            correct: 2
          },
          {
            question: "What does 'Insecure Design' (A04) in OWASP Top 10 2021 emphasize?",
            options: ["Poor implementation of security controls", "Flawed architecture and design decisions that can't be fixed with perfect implementation", "Weak cryptographic algorithms", "Missing security headers"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'api-security',
      icon: Network,
      title: "API Security Best Practices",
      description: "Comprehensive API security covering REST, GraphQL, gRPC, and modern authentication/authorization patterns.",
      difficulty: "Intermediate",
      duration: "75 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Modern API Security Landscape",
            content: "APIs have become the backbone of modern applications, with over 83% of web traffic being API calls. This creates an expanded attack surface requiring comprehensive security strategies beyond traditional web application protection.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "RESTful API security: Proper HTTP methods, resource-based URLs, stateless authentication",
              "GraphQL security: Query complexity analysis, depth limiting, introspection controls",
              "gRPC security: TLS encryption, authentication interceptors, rate limiting",
              "WebSocket security: Origin validation, authentication tokens, message validation",
              "API Gateway security: Centralized authentication, rate limiting, request/response validation",
              "Microservices security: Service-to-service authentication, network policies, zero-trust architecture"
            ]
          },
          {
            title: "Advanced Authentication & Authorization",
            content: "Implementing robust authentication and authorization using modern standards and patterns for API security.",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement OAuth 2.1 with PKCE (Proof Key for Code Exchange) for public clients and mobile applications",
              "Use JWT tokens with proper validation: signature verification, expiration checks, issuer validation, and audience claims",
              "Implement refresh token rotation and secure storage to prevent token replay attacks",
              "Apply fine-grained authorization with RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control)",
              "Use API keys for service-to-service authentication with proper rotation policies (30-90 days)",
              "Implement mutual TLS (mTLS) for high-security service-to-service communication",
              "Use scoped access tokens with minimum necessary permissions (principle of least privilege)",
              "Implement token introspection endpoints for distributed authorization decisions",
              "Apply context-aware authorization considering IP location, device fingerprinting, and behavioral analysis",
              "Use OpenID Connect for identity federation and single sign-on across multiple APIs"
            ]
          },
          {
            title: "API Threat Protection & Monitoring",
            content: "Protecting APIs against modern attack vectors including automated threats, business logic attacks, and advanced persistent threats.",
            image: "https://images.unsplash.com/photo-1621609764035-f5076e737976?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Rate limiting strategies: Token bucket, sliding window, distributed rate limiting with Redis clusters",
              "API abuse protection: Bot detection, behavioral analysis, CAPTCHA integration for suspicious activities",
              "Input validation: Schema validation, data type checking, business logic validation at API gateways",
              "Output sanitization: Response filtering, data masking, preventing information disclosure",
              "API versioning security: Secure deprecation strategies, backward compatibility security reviews",
              "API documentation security: Secure OpenAPI specs, redacted examples, security requirement documentation",
              "API testing automation: Integration with DAST tools, contract testing, security regression testing",
              "API observability: Structured logging, distributed tracing, security metrics and alerting",
              "Threat modeling for APIs: STRIDE analysis, data flow diagrams, attack surface analysis",
              "API incident response: Rapid token revocation, API circuit breakers, automated threat response"
            ]
          }
        ],
        quiz: [
          {
            question: "What is PKCE (Proof Key for Code Exchange) and when should it be used?",
            options: ["A new authentication protocol", "An OAuth 2.1 extension that prevents authorization code interception attacks, especially for mobile and public clients", "A type of API key", "A JWT validation method"],
            correct: 1
          },
          {
            question: "What is the most secure method for service-to-service API authentication in a zero-trust environment?",
            options: ["API keys with rate limiting", "Basic authentication over HTTPS", "Mutual TLS (mTLS) with certificate-based authentication", "OAuth 2.0 client credentials flow only"],
            correct: 2
          },
          {
            question: "Which of these is NOT a proper way to secure GraphQL APIs?",
            options: ["Query depth limiting", "Query complexity analysis", "Disabling introspection in production", "Allowing all queries for flexibility"],
            correct: 3
          },
          {
            question: "What should be included in proper JWT token validation?",
            options: ["Only signature verification", "Signature, expiration, issuer, and audience validation", "Just expiration checking", "Only issuer validation"],
            correct: 1
          },
          {
            question: "What is the primary security benefit of API gateways?",
            options: ["Faster response times", "Centralized security policy enforcement and monitoring", "Better caching", "Load balancing"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'cloud-security-best-practices',
      icon: Cloud,
      title: "Cloud Security Best Practices",
      description: "Master cloud security across AWS, Azure, and GCP using Zero Trust principles, Infrastructure as Code, and advanced threat detection.",
      difficulty: "Intermediate",
      duration: "80 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Cloud Security Fundamentals and Shared Responsibility",
            content: "Understanding the shared responsibility model across major cloud providers and implementing comprehensive security strategies for cloud-native architectures.",
            image: "https://images.unsplash.com/photo-1582213782179-e0d00f37f544?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "AWS Shared Responsibility: AWS secures infrastructure, you secure data, identity, applications, and network configurations",
              "Azure Shared Responsibility: Microsoft handles physical security and host OS, you manage guest OS, applications, and data protection",
              "GCP Shared Responsibility: Google manages platform security, you're responsible for access policies, data encryption, and application security",
              "Multi-cloud security considerations: Consistent security policies across different cloud providers",
              "Hybrid cloud security: Securing connectivity between on-premises and cloud environments",
              "Cloud Security Posture Management (CSPM): Continuous compliance monitoring and misconfiguration detection"
            ]
          },
          {
            title: "Zero Trust Cloud Architecture",
            content: "Implementing Zero Trust principles in cloud environments using identity-centric security, micro-segmentation, and continuous verification.",
            image: "https://images.unsplash.com/photo-1544197157-bb0364d97d95?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement identity-based perimeters: Use cloud IAM services (AWS IAM, Azure AD, Google Cloud Identity) as primary security boundary",
              "Apply least privilege access: Use just-in-time (JIT) access, privileged access management (PAM), and temporary credentials",
              "Implement network micro-segmentation: Use VPCs, security groups, network ACLs, and service meshes for traffic isolation",
              "Deploy continuous authentication: Multi-factor authentication, conditional access policies, and behavioral analysis",
              "Use encrypted communications: TLS 1.3, service mesh encryption (Istio, Linkerd), and encrypted storage",
              "Implement continuous monitoring: SIEM integration, user and entity behavior analytics (UEBA), and anomaly detection",
              "Apply policy as code: Define security policies in infrastructure as code (Terraform, CloudFormation, ARM templates)",
              "Use cloud-native security services: AWS GuardDuty, Azure Security Center, Google Cloud Security Command Center",
              "Implement workload identity: Service accounts, workload identity federation, and certificate-based authentication",
              "Deploy security automation: Automated remediation, security orchestration, and incident response workflows"
            ]
          },
          {
            title: "Advanced Cloud Security Controls",
            content: "Implementing advanced security controls including container security, serverless security, and cloud-native threat detection.",
            image: "https://images.unsplash.com/photo-1629904853716-9ce2f8319e34?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Container security: Image vulnerability scanning, runtime protection, admission controllers, and Pod Security Standards",
              "Serverless security: Function-level IAM, environment variable encryption, VPC configurations, and runtime application self-protection (RASP)",
              "Kubernetes security: RBAC, network policies, Pod Security Standards, service mesh security, and CIS Kubernetes benchmarks",
              "Data protection: Encryption at rest and in transit, key management (AWS KMS, Azure Key Vault, Google Cloud KMS), and data loss prevention",
              "API Gateway security: Throttling, authentication, authorization, input validation, and Web Application Firewall (WAF) integration",
              "Cloud storage security: Bucket policies, access logging, versioning, cross-region replication, and lifecycle policies",
              "Database security: Encryption, network isolation, database activity monitoring, and privileged user monitoring",
              "Logging and monitoring: CloudTrail, Azure Activity Log, Google Cloud Audit Logs, and security information correlation",
              "Incident response: Automated isolation, forensic capabilities, and disaster recovery procedures",
              "Compliance and governance: Policy enforcement, compliance reporting, and regulatory requirement mapping"
            ]
          }
        ],
        quiz: [
          {
            question: "In the cloud shared responsibility model, who is responsible for patching the guest operating system in an EC2 instance?",
            options: ["AWS", "The customer", "Both AWS and the customer", "It depends on the instance type"],
            correct: 1
          },
          {
            question: "What is the core principle of Zero Trust architecture in cloud environments?",
            options: ["Trust internal networks by default", "Never trust, always verify - regardless of location", "Only use VPNs for access", "Trust cloud provider security controls"],
            correct: 1
          },
          {
            question: "Which cloud security service provides threat intelligence and anomaly detection?",
            options: ["AWS CloudTrail", "AWS GuardDuty", "AWS Config", "AWS CloudFormation"],
            correct: 1
          },
          {
            question: "What is the most effective way to secure microservices communication in cloud environments?",
            options: ["API keys", "Basic authentication", "Service mesh with mutual TLS (mTLS)", "Network ACLs only"],
            correct: 2
          },
          {
            question: "What is Cloud Security Posture Management (CSPM) primarily used for?",
            options: ["Network monitoring", "Continuous compliance monitoring and misconfiguration detection", "Data backup", "Performance optimization"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'container-security',
      icon: Bug,
      title: "Container Security Fundamentals",
      description: "Comprehensive container and Kubernetes security including image security, runtime protection, and supply chain security.",
      difficulty: "Intermediate",
      duration: "70 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Container Security Lifecycle",
            content: "Securing containers throughout their entire lifecycle from build to runtime, including image security, registry security, and orchestration security.",
            image: "https://images.unsplash.com/photo-1629904853716-9ce2f8319e34?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Build phase security: Secure base images, minimal attack surface, vulnerability scanning in CI/CD",
              "Registry security: Image signing, access controls, vulnerability monitoring, and trusted registries",
              "Deployment security: Admission controllers, security contexts, and policy enforcement",
              "Runtime security: Runtime monitoring, anomaly detection, and incident response",
              "Network security: Service mesh, network policies, and encrypted communications",
              "Data security: Volume encryption, secrets management, and data protection"
            ]
          },
          {
            title: "Dockerfile Security and Image Hardening",
            content: "Creating secure container images using security best practices, minimal base images, and proper configuration management.",
            image: "https://images.unsplash.com/photo-1621609764035-f5076e737976?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Use minimal base images: Alpine, distroless, or scratch images to reduce attack surface",
              "Implement multi-stage builds: Separate build and runtime environments to exclude build tools from final images",
              "Run as non-root user: Create dedicated user accounts and use USER instruction in Dockerfiles",
              "Scan for vulnerabilities: Integrate tools like Trivy, Clair, or Snyk into CI/CD pipelines",
              "Sign container images: Use Docker Content Trust, Cosign, or Notary for image authenticity verification",
              "Minimize layers: Combine RUN commands and clean up package caches to reduce image size",
              "Use .dockerignore: Exclude sensitive files, secrets, and unnecessary files from build context",
              "Implement health checks: Define proper health check endpoints for container orchestrators",
              "Avoid secrets in images: Use external secret management systems instead of embedding credentials",
              "Keep images updated: Regularly rebuild images with latest security patches and updates"
            ]
          },
          {
            title: "Kubernetes Security Architecture",
            content: "Implementing comprehensive Kubernetes security using RBAC, network policies, Pod Security Standards, and admission controllers.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            examples: [
              "RBAC implementation: Fine-grained permissions using Roles, ClusterRoles, RoleBindings, and service accounts",
              "Pod Security Standards: Enforce privileged, baseline, or restricted security policies at namespace level",
              "Network policies: Implement micro-segmentation using Kubernetes Network Policies and Calico/Cilium",
              "Admission controllers: Use ValidatingAdmissionWebhooks and MutatingAdmissionWebhooks for policy enforcement",
              "Secrets management: Use Kubernetes Secrets, external secret operators (External Secrets Operator), and sealed secrets",
              "Resource quotas and limits: Prevent resource exhaustion attacks and ensure fair resource allocation",
              "Security contexts: Configure runAsNonRoot, readOnlyRootFilesystem, and capabilities dropping",
              "Service mesh security: Implement mutual TLS, traffic policies, and observability with Istio or Linkerd",
              "Monitoring and logging: Use Falco for runtime security monitoring and audit logging for compliance",
              "Cluster hardening: Follow CIS Kubernetes benchmarks and implement API server security configurations"
            ]
          }
        ],
        quiz: [
          {
            question: "What is the primary security benefit of using distroless or minimal base images?",
            options: ["Faster startup times", "Reduced attack surface by eliminating unnecessary packages and tools", "Better performance", "Smaller network footprint"],
            correct: 1
          },
          {
            question: "Which Kubernetes feature provides fine-grained access control to API resources?",
            options: ["Network Policies", "Pod Security Standards", "Role-Based Access Control (RBAC)", "Service Mesh"],
            correct: 2
          },
          {
            question: "What is the purpose of admission controllers in Kubernetes security?",
            options: ["Monitor runtime behavior", "Control network traffic", "Enforce policies before objects are persisted to etcd", "Manage container images"],
            correct: 2
          },
          {
            question: "Which tool is commonly used for runtime security monitoring in Kubernetes?",
            options: ["Prometheus", "Grafana", "Falco", "Jenkins"],
            correct: 2
          },
          {
            question: "What is mutual TLS (mTLS) in the context of container security?",
            options: ["A way to encrypt data at rest", "Bidirectional authentication and encryption between services", "A method for signing container images", "A type of network policy"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'ci-cd-security',
      icon: Network,
      title: "CI/CD Pipeline Security",
      description: "Secure your DevSecOps pipelines with shift-left security, automated testing, and supply chain protection.",
      difficulty: "Advanced",
      duration: "85 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "DevSecOps and Shift-Left Security",
            content: "Integrating security throughout the software development lifecycle (SDLC) using DevSecOps practices and automated security testing.",
            image: "https://images.unsplash.com/photo-1621609764035-f5076e737976?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Shift-left philosophy: Integrate security early in development with IDE plugins and pre-commit hooks",
              "Security as code: Define security policies, tests, and configurations in version-controlled code",
              "Automated security testing: SAST, DAST, IAST, and SCA integrated into CI/CD pipelines",
              "Threat modeling automation: Generate threat models from architecture diagrams and code analysis",
              "Security training integration: Just-in-time security guidance and education for developers",
              "Compliance automation: Automated compliance checking and evidence collection"
            ]
          },
          {
            title: "Pipeline Security Architecture",
            content: "Designing secure CI/CD pipelines with proper access controls, secret management, and isolation between environments.",
            image: "https://images.unsplash.com/photo-1627993214810-7e3e060c4103?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement pipeline-as-code: Define CI/CD pipelines in version control with proper review processes",
              "Use least privilege access: Grant minimal permissions to pipeline components and service accounts",
              "Implement secret management: Use HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault for credentials",
              "Secure build environments: Use ephemeral, isolated build agents and containers for each build",
              "Implement pipeline approval gates: Require security sign-offs for production deployments",
              "Use signed commits and tags: Implement GPG signing for code commits and release tags",
              "Deploy dependency scanning: Use tools like Snyk, FOSSA, or Dependabot to monitor third-party components",
              "Implement infrastructure as code (IaC) scanning: Scan Terraform, CloudFormation, and Kubernetes manifests",
              "Use immutable artifacts: Create immutable build artifacts with cryptographic signatures",
              "Implement deployment verification: Automated security testing in staging environments before production"
            ]
          },
          {
            title: "Advanced Security Testing Integration",
            content: "Implementing comprehensive automated security testing throughout the CI/CD pipeline using modern tools and techniques.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            examples: [
              "Static Application Security Testing (SAST): SonarQube, Checkmarx, CodeQL for source code analysis",
              "Dynamic Application Security Testing (DAST): OWASP ZAP, Burp Suite Professional for runtime vulnerability scanning",
              "Interactive Application Security Testing (IAST): Contrast Security, Seeker for real-time vulnerability detection",
              "Software Composition Analysis (SCA): WhiteSource, Snyk, FOSSA for open source vulnerability management",
              "Container image scanning: Trivy, Clair, Twistlock for container vulnerability assessment",
              "Infrastructure as Code (IaC) scanning: Checkov, Terrascan, Bridgecrew for cloud configuration security",
              "API security testing: Automated API fuzzing, schema validation, and authentication testing",
              "License compliance checking: FOSSA, Black Duck for open source license management",
              "Security regression testing: Automated tests for previously identified vulnerabilities",
              "Performance security testing: Load testing with security monitoring to identify DoS vulnerabilities"
            ]
          }
        ],
        quiz: [
          {
            question: "What does 'shift-left' mean in DevSecOps?",
            options: ["Moving servers to the left data center", "Integrating security earlier in the development process", "Using left-handed developers", "Shifting responsibility to the left team"],
            correct: 1
          },
          {
            question: "Which type of security testing analyzes source code without executing it?",
            options: ["DAST (Dynamic)", "SAST (Static)", "IAST (Interactive)", "Manual penetration testing"],
            correct: 1
          },
          {
            question: "What is the primary security benefit of using ephemeral build environments?",
            options: ["Faster builds", "Isolation and prevention of cross-contamination between builds", "Lower costs", "Better performance"],
            correct: 1
          },
          {
            question: "Which tool category helps identify vulnerable open source components in your application?",
            options: ["SAST", "DAST", "Software Composition Analysis (SCA)", "IAST"],
            correct: 2
          },
          {
            question: "What is Infrastructure as Code (IaC) scanning designed to detect?",
            options: ["Runtime vulnerabilities", "Misconfigurations and security issues in infrastructure definitions", "Network intrusions", "Database vulnerabilities"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'supply-chain-security',
      icon: Network,
      title: "Software Supply Chain Security",
      description: "Protect against supply chain attacks using SLSA framework, SBOM management, and vendor risk assessment.",
      difficulty: "Intermediate",
      duration: "75 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Understanding Supply Chain Threats",
            content: "Modern supply chain attacks have evolved from simple dependency confusion to sophisticated nation-state attacks targeting build systems, package repositories, and development tools.",
            image: "https://images.unsplash.com/photo-1621609764035-f5076e737976?w=600&h=400&fit=crop&auto=format",
            examples: [
              "SolarWinds (2020): Compromised build system inserted malicious code into Orion software updates, affecting 18,000+ customers including government agencies",
              "Codecov (2021): Bash uploader script modification allowed attackers to steal credentials and source code from customer CI/CD environments",
              "Kaseya (2021): VSA software supply chain attack deployed REvil ransomware to 1,500+ downstream companies through managed service providers",
              "npm left-pad (2016): Developer unpublished a popular package, breaking thousands of applications and demonstrating fragility of package ecosystems",
              "Dependency confusion attacks: Attackers upload malicious packages with higher version numbers to public repositories, exploiting misconfigured private registries",
              "Typosquatting attacks: Malicious packages with names similar to popular libraries (e.g., 'nmp' instead of 'npm') to trick developers",
              "Build system compromises: Attackers target CI/CD systems, code repositories, and development environments to inject malicious code",
              "Package repository attacks: Compromising maintainer accounts or package registry infrastructure to distribute malicious updates"
            ]
          },
          {
            title: "SLSA Framework Implementation",
            content: "Supply-chain Levels for Software Artifacts (SLSA) provides a security framework for protecting software supply chains with increasing levels of security guarantees.",
            image: "https://images.unsplash.com/photo-1627993214810-7e3e060c4103?w=600&h=400&fit=crop&auto=format",
            actions: [
              "SLSA Level 1: Version control system tracks changes, build process generates provenance metadata",
              "SLSA Level 2: Build service generates authenticated provenance, use hosted build platforms (GitHub Actions, Cloud Build)",
              "SLSA Level 3: Hardened build platforms, non-falsifiable provenance, and isolation between builds",
              "SLSA Level 4: Requires two-person review of changes and hermetic, reproducible builds",
              "Implement build provenance: Generate and verify SLSA provenance attestations using in-toto or SLSA generators",
              "Use reproducible builds: Ensure builds produce identical outputs given the same inputs",
              "Implement artifact signing: Use sigstore/cosign, GPG, or similar tools to sign software artifacts",
              "Deploy SBOM generation: Create Software Bills of Materials (SBOM) in SPDX or CycloneDX format",
              "Verify dependency integrity: Use lock files, checksums, and signature verification for all dependencies",
              "Monitor for supply chain threats: Use tools like Sonatype Nexus, JFrog Xray, or Snyk for continuous monitoring"
            ]
          },
          {
            title: "SBOM Management and Vendor Risk",
            content: "Managing Software Bills of Materials (SBOM) and assessing third-party vendor risk to maintain supply chain visibility and security.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "SBOM generation: Automatically generate SBOMs during build process using tools like syft, cdxgen, or FOSSA",
              "SBOM formats: Support SPDX 2.3 and CycloneDX 1.4 formats for interoperability and compliance",
              "Vulnerability management: Correlate SBOM data with CVE databases for continuous vulnerability monitoring",
              "License compliance: Track open source licenses and ensure compliance with organizational policies",
              "Supplier assessment: Evaluate third-party vendors' security practices, certifications, and incident history",
              "Dependency pinning: Use exact version specifications and lock files to prevent unexpected updates",
              "Private package registries: Host internal packages and proxy external packages through secured registries",
              "Continuous monitoring: Monitor package repositories and vendor security advisories for threats",
              "Incident response: Develop procedures for responding to supply chain compromises and dependency vulnerabilities",
              "Risk scoring: Implement risk-based approaches to prioritize security efforts on critical dependencies",
              "Vendor questionnaires: Standardize security assessments for software vendors and service providers",
              "Contract security: Include security requirements, right-to-audit clauses, and breach notification terms"
            ]
          }
        ],
        quiz: [
          {
            question: "What was the primary attack vector in the SolarWinds supply chain attack?",
            options: ["Compromised package repository", "Malicious dependency", "Compromised build system injecting code into software updates", "Phishing attack on developers"],
            correct: 2
          },
          {
            question: "What does SLSA stand for and what is its purpose?",
            options: ["Software License Security Agreement - managing licenses", "Supply-chain Levels for Software Artifacts - framework for supply chain security", "Secure Linked Software Architecture - system design", "Software Liability Security Assessment - risk evaluation"],
            correct: 1
          },
          {
            question: "What is an SBOM and why is it important for supply chain security?",
            options: ["Software Bug Management - tracking defects", "Software Bills of Materials - inventory of software components for vulnerability management", "Secure Build Operations Manual - documentation", "System Backup and Operations Management - data protection"],
            correct: 1
          },
          {
            question: "Which SLSA level requires two-person review and hermetic builds?",
            options: ["Level 1", "Level 2", "Level 3", "Level 4"],
            correct: 3
          },
          {
            question: "What is dependency confusion attack?",
            options: ["Mixing up different dependency versions", "Uploading malicious packages to public repositories with names/versions that trick private registry lookups", "Confusing developers about which dependencies to use", "Dependencies conflicting with each other"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'database-security',
      icon: Shield,
      title: "Database Security Fundamentals",
      description: "Secure your databases against common threats including SQL injection, privilege escalation, and data breaches.",
      difficulty: "Intermediate",
      duration: "35 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Database Access Control",
            content: "Implementing proper access control is crucial for database security and compliance.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Implement principle of least privilege for database accounts",
              "Use dedicated service accounts for applications, not shared accounts",
              "Enable database audit logging for all privileged operations",
              "Regularly review and rotate database credentials",
              "Implement database firewalls to restrict network access"
            ]
          },
          {
            title: "Data Protection & Encryption",
            content: "Protecting sensitive data at rest and in transit is essential for regulatory compliance and security.",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Enable transparent data encryption (TDE) for data at rest",
              "Use TLS/SSL encryption for all database connections",
              "Implement column-level encryption for highly sensitive data",
              "Properly manage encryption keys using dedicated key management systems",
              "Regular backup testing and secure backup storage",
              "Implement data masking for non-production environments"
            ]
          }
        ],
        quiz: [
          {
            question: "What is the most effective way to prevent SQL injection in database applications?",
            options: ["Input sanitization only", "Stored procedures only", "Parameterized queries/prepared statements", "Database firewalls only"],
            correct: 2
          },
          {
            question: "Why should you use dedicated service accounts for database applications?",
            options: ["Better performance", "Easier management", "Improved security and audit trail", "Reduced licensing costs"],
            correct: 2
          }
        ]
      }
    },
    {
      id: 'threat-modeling',
      icon: Target,
      title: "Threat Modeling for Developers",
      description: "Learn systematic approaches to identify and mitigate security threats in your applications and systems.",
      difficulty: "Advanced",
      duration: "55 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Introduction to Threat Modeling",
            content: "Threat modeling is a structured approach to identifying, quantifying, and addressing security risks.",
            image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&auto=format",
            examples: [
              "STRIDE methodology: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege",
              "DREAD scoring: Damage, Reproducibility, Exploitability, Affected users, Discoverability",
              "Attack trees: Visual representation of possible attack paths against a system"
            ]
          },
          {
            title: "Implementing Threat Models",
            content: "Practical steps for creating and maintaining threat models throughout the development lifecycle.",
            image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Create data flow diagrams (DFDs) to understand system architecture",
              "Identify trust boundaries and entry points in your application",
              "Apply STRIDE categories to each component and data flow",
              "Prioritize threats using risk scoring methodologies",
              "Document security controls and mitigation strategies",
              "Update threat models when architecture or requirements change"
            ]
          }
        ],
        quiz: [
          {
            question: "What does the 'S' in STRIDE stand for?",
            options: ["Security", "Spoofing", "System", "Software"],
            correct: 1
          },
          {
            question: "When should threat modeling be performed in the development lifecycle?",
            options: ["Only after deployment", "During the design phase", "Only when security incidents occur", "Never - it's too time consuming"],
            correct: 1
          }
        ]
      }
    },
    {
      id: 'zero-trust-architecture',
      icon: Lock,
      title: "Zero Trust Architecture Principles",
      description: "Understand and implement zero trust security principles in your applications and infrastructure.",
      difficulty: "Advanced",
      duration: "40 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Zero Trust Fundamentals",
            content: "Zero Trust operates on the principle of 'never trust, always verify' regardless of location or user.",
            image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Verify identity and device health before granting access",
              "Apply least privilege access for every user, device, and application",
              "Assume breach - monitor and analyze all network traffic",
              "Use microsegmentation to limit lateral movement",
              "Encrypt all communications end-to-end"
            ]
          },
          {
            title: "Implementing Zero Trust",
            content: "Practical approaches to implementing zero trust principles in modern applications.",
            image: "https://images.unsplash.com/photo-1544197157-bb0364d97d95?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement mutual TLS (mTLS) for service-to-service communication",
              "Use identity-based access controls rather than network-based",
              "Deploy network segmentation and micro-perimeters",
              "Implement continuous authentication and authorization",
              "Monitor all network traffic and user behavior for anomalies",
              "Use software-defined perimeters (SDP) for remote access"
            ]
          }
        ],
        quiz: [
          {
            question: "What is the core principle of Zero Trust security?",
            options: ["Trust but verify", "Never trust, always verify", "Trust internal users only", "Verify once, trust forever"],
            correct: 1
          },
          {
            question: "Which of these is NOT a key component of Zero Trust architecture?",
            options: ["Identity verification", "Device compliance", "Network location", "Least privilege access"],
            correct: 2
          }
        ]
      }
    },
    {
      id: 'privacy-by-design',
      icon: Eye,
      title: "Privacy by Design for Developers",
      description: "Integrate privacy principles into your development process to comply with GDPR, CCPA, and other regulations.",
      difficulty: "Intermediate",
      duration: "30 min",
      department: "engineering",
      type: "interactive",
      target_audience: 'engineering',
      content: {
        sections: [
          {
            title: "Privacy by Design Principles",
            content: "Privacy by Design requires that privacy be taken into account throughout the engineering process.",
            image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop&auto=format",
            checklist: [
              "Proactive not reactive: Anticipate privacy issues before they occur",
              "Privacy as the default: Maximum privacy protection without user action",
              "Data minimization: Collect only what is necessary for the stated purpose",
              "Transparency: Ensure all stakeholders know how data is being used",
              "Security: Protect personal data with strong security measures"
            ]
          },
          {
            title: "Technical Implementation",
            content: "Practical techniques for implementing privacy controls in your applications.",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&auto=format",
            actions: [
              "Implement data anonymization and pseudonymization techniques",
              "Build user consent management systems with granular controls",
              "Design data retention policies and automated deletion procedures",
              "Implement data portability features for user data export",
              "Build audit logs for all personal data processing activities",
              "Design systems to support right to erasure (right to be forgotten)"
            ]
          }
        ],
        quiz: [
          {
            question: "What does 'data minimization' mean in privacy by design?",
            options: ["Compressing data to save space", "Collecting only necessary data for the stated purpose", "Minimizing data processing time", "Reducing data storage costs"],
            correct: 1
          },
          {
            question: "Which privacy principle requires maximum protection without user configuration?",
            options: ["Proactive not reactive", "Privacy by default", "Full functionality", "End-to-end security"],
            correct: 1
          }
        ]
      }
    }
  ], []); // Empty dependency array means this array is created once and stable

  const loadTrainingProgress = useCallback(async (userData) => {
    try {
      if (!userData || !userData.company_id || !userData.email) {
          console.warn("User data incomplete for loading progress.");
          setUserProgress({});
          return;
      }
      // Use cached + backoff wrapper to avoid 429s
      const progressRecords = await CachedEntityManager.get(
        TrainingProgress,
        "filter",
        [
          { company_id: userData.company_id, user_email: userData.email },
          "-updated_date",
          200
        ],
        `TrainingProgress_${userData.company_id}_${userData.email}`
      );

      const progressMap = {};
      progressRecords.forEach(record => {
        const progressData = record.progress_data ? JSON.parse(record.progress_data) : {};
        progressMap[record.module_id] = {
          completed: record.completed,
          completion_date: record.completion_date,
          last_accessed_date: record.last_accessed_date,
          quiz_score: record.quiz_score,
          quiz_attempts: record.quiz_attempts,
          sections_completed: progressData.sections_completed || [],
          current_section: progressData.current_section || 0,
          quiz_answers: progressData.quiz_answers || {}
        };
      });

      setUserProgress(progressMap);
    } catch (error) {
      console.error("Error loading training progress:", error);
      setUserProgress({});
    }
  }, []);

  // NEW: Load Badges for the user (with caching + backoff)
  const loadBadges = useCallback(async (userData) => {
    if (!userData || !userData.company_id || !userData.email) {
      console.warn("User data incomplete for loading badges.");
      setBadges([]);
      return;
    }
    try {
      const rows = await CachedEntityManager.get(
        TrainingBadge,
        "filter",
        [
          { company_id: userData.company_id, user_email: userData.email },
          "-awarded_date",
          50
        ],
        `TrainingBadge_${userData.company_id}_${userData.email}`
      );
      setBadges(rows);
    } catch (error) {
      console.error("Error loading badges:", error);
      setBadges([]);
    }
  }, []);

  // Enhanced: Check if a module has video content
  const getModuleVideo = useCallback(async (moduleId) => {
    try {
      if (!user) return null;

      const videos = await CachedEntityManager.get(
        TrainingVideo,
        "filter",
        [
          {
            company_id: user.company_id,
            user_email: user.email, // Also filter by user email for personalized videos if any
            module_id: moduleId,
            target_audience: selectedRoleType,
            is_active: true
          },
          "video_order",
          5
        ],
        `TrainingVideo_${user?.company_id}_${moduleId}_${selectedRoleType}`
      );

      return videos.length > 0 ? videos[0] : null;
    } catch (error) {
      console.error("Error checking for video:", error);
      return null;
    }
  }, [user, selectedRoleType]); // getModuleVideo depends on user and selectedRoleType

  // NEW: Build Recommendations (use cache + region + org allow-list)
  const buildRecommendations = useCallback(async (userData, org) => {
    if (!userData || !userData.company_id || !userData.email) {
      console.warn("User data incomplete for building recommendations.");
      setRecommendedModules([]);
      setRecentThreats([]);
      return;
    }
    try {
      // 1) Latest completed assessment for this company (for maturity gaps)
      const latestCompleted = await CachedEntityManager.get(
        Assessment,
        "filter",
        [
          { company_id: userData.company_id, status: "completed" },
          "-updated_date",
          1
        ],
        `Assessment_latest_${userData.company_id}`
      );
      const assessment = latestCompleted?.[0];

      // 2) Recent threat advisories (last 90 days, high/critical) with caching
      const advisories = await CachedEntityManager.get(
        ThreatAdvisory,
        "list",
        ["-published_date", 50],
        "ThreatAdvisory_recent_50"
      );
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Regions filtering — global by default if none set
      const companyRegions = Array.isArray(org?.operating_regions) && org.operating_regions.length > 0
        ? org.operating_regions
        : ["Global"];

      const recent = advisories.filter(a => {
        const d = a.published_date ? new Date(a.published_date) : null;
        const sev = String(a.severity || "").toLowerCase();
        const regions = Array.isArray(a.regions) ? a.regions : [];
        const regionMatch = regions.length === 0 // advisory applies broadly
          || regions.includes("Global")
          || companyRegions.some(r => regions.includes(r));
        return d && d >= ninetyDaysAgo && (sev === "high" || sev === "critical") && regionMatch;
      }).slice(0, 5); // Limit to 5 most recent high/critical threats
      setRecentThreats(recent);

      // 3) Map maturity gaps to modules (weakness <= 2 and not NA)
      const domainToModules = {
        maturity_security_training: ['phishing-awareness', 'password-security', 'social-engineering', 'incident-reporting'],
        maturity_incident_response: ['incident-reporting', 'ransomware-awareness'],
        maturity_cloud_security: ['cloud-security-best-practices'],
        maturity_app_security: ['secure-code-owasp', 'api-security', 'ci-cd-security'],
        maturity_third_party_risk: ['supply-chain-security'],
        maturity_data_protection: ['data-handling'],
        maturity_infra_security: ['remote-work-security', 'physical-security', 'ransomware-awareness'],
        maturity_business_continuity: ['ransomware-awareness', 'incident-reporting']
      };

      let recIds = [];
      if (assessment) {
        const naFlags = {
          maturity_security_training_na: assessment.maturity_security_training_na,
          maturity_incident_response_na: assessment.maturity_incident_response_na,
          maturity_cloud_security_na: assessment.maturity_cloud_security_na,
          maturity_app_security_na: assessment.maturity_app_security_na,
          maturity_third_party_risk_na: assessment.maturity_third_party_risk_na,
          maturity_data_protection_na: assessment.maturity_data_protection_na,
          maturity_infra_security_na: assessment.maturity_infra_security_na,
          maturity_business_continuity_na: assessment.maturity_business_continuity_na
        };

        Object.entries(domainToModules).forEach(([domain, moduleIds]) => {
          // Use a robust way to get the numeric value, considering potential field naming variations
          const value = Number(assessment?.[domain] ?? 0); // e.g., assessment.maturity_security_training
          const naKey = `${domain}_na`;
          const isNA = naFlags[naKey] || assessment?.[naKey]; // e.g., assessment.maturity_security_training_na
          if (!isNA && value <= 2) { // Assuming 1-5 scale where 1-2 is weak
            recIds.push(...moduleIds);
          }
        });
      }

      // 4) Threat-aware recommendations based on tags/keywords
      const threatsText = (recent || []).map(t => `${t.title} ${t.summary} ${(t.tags || []).join(' ')}`.toLowerCase()).join(' ');
      if (threatsText.includes('ransomware')) recIds.push('ransomware-awareness');
      if (threatsText.includes('phishing')) recIds.push('phishing-awareness');
      if (threatsText.includes('credential') || threatsText.includes('password') || threatsText.includes('mfa')) recIds.push('password-security');
      if (threatsText.includes('api') || threatsText.includes('web application') || threatsText.includes('injection')) recIds.push('api-security', 'secure-code-owasp');
      if (threatsText.includes('supply chain') || threatsText.includes('open source')) recIds.push('supply-chain-security');
      if (threatsText.includes('cloud') || threatsText.includes('aws') || threatsText.includes('azure') || threatsText.includes('gcp')) recIds.push('cloud-security-best-practices');
      if (threatsText.includes('container') || threatsText.includes('kubernetes')) recIds.push('container-security');


      // 5) De-duplicate, filter by chosen role, and map to modules present
      const idSet = Array.from(new Set(recIds));
      const presentById = Object.fromEntries(allTrainingModules.map(m => [m.id, m]));
      const filteredByRole = idSet
        .map(id => presentById[id])
        .filter(Boolean) // Remove any null/undefined entries if module ID didn't exist
        .filter(m => m.target_audience === selectedRoleType);

      // Respect company training allow-list if present
      const enabledSet = new Set(org?.training_enabled_modules || []);
      const finalList = enabledSet.size > 0
        ? filteredByRole.filter(m => enabledSet.has(m.id))
        : filteredByRole;

      setRecommendedModules(finalList);
    } catch (error) {
      console.error("Error building recommendations:", error);
      setRecommendedModules([]);
      setRecentThreats([]);
    }
  }, [allTrainingModules, selectedRoleType]);

  const loadUserAndProgress = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);

      // Set the selected role type from user data, defaulting to 'general'
      setSelectedRoleType(userData.role_type || 'general');

      // NEW: fetch company to drive global/org tailoring
      let org = null;
      if (userData.company_id) {
        org = await Company.get(userData.company_id);
        setCompany(org || null);
      }

      // Sequential loads to avoid rate limiting bursts
      await loadTrainingProgress(userData);
      await loadBadges(userData);
      await buildRecommendations(userData, org); // Pass org directly

    } catch (error) {
      console.error("Error loading user data:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [loadTrainingProgress, loadBadges, buildRecommendations]);

  useEffect(() => {
    loadUserAndProgress();
  }, [loadUserAndProgress]);

  const saveTrainingProgress = useCallback(async (moduleId, progressData) => {
    if (!user || savingProgress) return;

    setSavingProgress(true);
    try {
      const existingRecords = await TrainingProgress.filter({
        company_id: user.company_id,
        user_email: user.email,
        module_id: moduleId
      });

      const progressRecord = {
        company_id: user.company_id,
        user_email: user.email,
        module_id: moduleId,
        progress_data: JSON.stringify({
          sections_completed: progressData.sections_completed || [],
          current_section: progressData.current_section || 0,
          quiz_answers: progressData.quiz_answers || {}
        }),
        completed: progressData.completed || false,
        completion_date: progressData.completed ? new Date().toISOString() : null,
        last_accessed_date: new Date().toISOString(),
        quiz_score: progressData.quiz_score || null,
        quiz_attempts: progressData.quiz_attempts || 0
      };

      if (existingRecords.length > 0) {
        await TrainingProgress.update(existingRecords[0].id, progressRecord);
      } else {
        await TrainingProgress.create(progressRecord);
      }

      // Update local state
      setUserProgress(prev => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId], // Preserve previous fields if not explicitly updated
          ...progressData
        }
      }));

    } catch (error) {
      console.error("Error saving training progress:", error);
    } finally {
      setSavingProgress(false);
    }
  }, [user, savingProgress]);

  // NEW: Award badges on high performance and milestones
  const awardBadgesIfEligible = useCallback(async (module, score) => {
    if (!user || !module || !user.company_id || !user.email) return;

    try {
      // Fetch both badge checks in parallel
      const masteryKey = `module_mastery_${module.id}`;
      const championKey = 'security_champion';
      const progressRows = Object.values(userProgress || {});
      const championCount = progressRows.filter(p => p?.completed && (p?.quiz_score || 0) >= 80).length;

      const [existingMastery, existingChampion] = await Promise.all([
        score >= 90 ? TrainingBadge.filter({ company_id: user.company_id, user_email: user.email, badge_key: masteryKey }, undefined, 1) : Promise.resolve([{ id: 'skip' }]),
        championCount >= 4 ? TrainingBadge.filter({ company_id: user.company_id, user_email: user.email, badge_key: championKey }, undefined, 1) : Promise.resolve([{ id: 'skip' }]),
      ]);

      // 1) Module Mastery: score >= 90 on a module
      if (score >= 90) {
        const badgeKey = masteryKey;
        const existing = existingMastery;
        if (existing.length === 0) {
          await TrainingBadge.create({
            company_id: user.company_id,
            user_email: user.email,
            badge_key: badgeKey,
            label: `Module Mastery: ${module.title}`,
            description: "Scored 90%+ on this module's quiz.",
            module_id: module.id,
            score,
            awarded_date: new Date().toISOString()
          });
        }
      }

      // 2) Security Champion: 4+ modules completed with score >= 80 (uses pre-fetched existingChampion)
      if (championCount >= 4 && existingChampion.length === 0) {
        await TrainingBadge.create({
          company_id: user.company_id,
          user_email: user.email,
          badge_key: championKey,
          label: 'Security Champion',
          description: 'Completed 4+ modules with scores of 80% or higher.',
          awarded_date: new Date().toISOString()
        });
      }

      // refresh badges panel
      await loadBadges(user);
    } catch (error) {
      console.error("Error awarding badges:", error);
    }
  }, [user, userProgress, loadBadges]);


  // Handle role type change and save to user profile
  const handleRoleTypeChange = useCallback(async (newRoleType) => {
    setSavingRoleType(true);
    try {
      setSelectedRoleType(newRoleType);

      // Save the preference to the user's profile
      await User.updateMyUserData({ role_type: newRoleType });

      // Update local user state
      setUser(prev => ({ ...prev, role_type: newRoleType }));

      // NEW: Re-build recommendations for the new role type
      if (user) {
        await buildRecommendations(user, company); // Pass company directly
      }

    } catch (error) {
      console.error("Error saving role type:", error);
      // Revert the selection on error
      setUser(prev => ({ ...prev, role_type: prev.role_type || 'general' })); // Revert to previous or default
      setSelectedRoleType(user.role_type || 'general'); // Revert the UI state
    } finally {
      setSavingRoleType(false);
    }
  }, [user, company, buildRecommendations]);

  const startTraining = useCallback(async (module) => {
    setCurrentTraining(module);

    const progress = userProgress[module.id] || {};
    setCurrentSection(progress.current_section || 0);
    setQuizAnswers(progress.quiz_answers || {});
    setShowQuizResults(false);
    setQuizFeedback([]); // Reset feedback

    // Save access timestamp
    await saveTrainingProgress(module.id, {
      ...progress,
      current_section: progress.current_section || 0
    });
  }, [userProgress, saveTrainingProgress]);


  const closeTraining = useCallback(() => {
    setCurrentTraining(null);
    setCurrentSection(0);
    setQuizAnswers({});
    setShowQuizResults(false);
    setQuizFeedback([]);
  }, []);

  const handleQuizSubmit = useCallback(async (module) => {
    if (!module || !module.content.quiz || savingProgress) return;

    const quiz = module.content.quiz;
    const correctCount = Object.entries(quizAnswers).filter(([qIndex, answer]) =>
      quiz[parseInt(qIndex)].correct === answer
    ).length;
    const score = Math.round((correctCount / quiz.length) * 100);
    const passed = score >= 70;

    // Generate feedback for all questions
    const newQuizFeedback = quiz.map((q, qIndex) => {
      if (quizAnswers[qIndex] === q.correct) {
        return null; // Correct answer
      } else {
        return "This answer was incorrect. Please review the training material to understand the correct concept.";
      }
    });

    setQuizFeedback(newQuizFeedback);
    setShowQuizResults(true);

    const moduleProgress = userProgress[module.id] || {};
    let sectionsCompleted = [...(moduleProgress.sections_completed || [])];

    // Mark all content sections as completed when quiz is submitted (regardless of pass/fail)
    for (let i = 0; i < module.content.sections.length; i++) {
      if (!sectionsCompleted.includes(i)) {
        sectionsCompleted.push(i);
      }
    }

    await saveTrainingProgress(module.id, {
      ...moduleProgress,
      sections_completed: sectionsCompleted,
      current_section: currentSection, // Stay on quiz section
      quiz_answers: quizAnswers,
      completed: passed, // Mark module completed only if quiz is passed
      quiz_score: score,
      quiz_attempts: (moduleProgress.quiz_attempts || 0) + 1
    });

    // NEW: award badges based on performance/milestones
    await awardBadgesIfEligible(module, score);
  }, [quizAnswers, savingProgress, userProgress, currentSection, saveTrainingProgress, awardBadgesIfEligible]);


  const handleNextSection = useCallback(async () => {
    if (!currentTraining) return;

    const totalSections = currentTraining.content.sections.length;
    const isCurrentlyQuizSection = currentSection >= totalSections;
    const quiz = currentTraining.content.quiz; // This reference is stable within currentTraining

    let nextSection = currentSection;
    let newShowQuizResults = showQuizResults;
    let newQuizAnswers = quizAnswers;
    let newQuizFeedback = quizFeedback;
    let newIsCompleted = userProgress[currentTraining.id]?.completed || false;
    let newQuizScore = userProgress[currentTraining.id]?.quiz_score || null;
    let newQuizAttempts = userProgress[currentTraining.id]?.quiz_attempts || 0;

    const moduleProgress = userProgress[currentTraining.id] || {};
    let sectionsCompleted = [...(moduleProgress.sections_completed || [])];

    if (!isCurrentlyQuizSection) {
      // User is in a content section
      if (currentSection < totalSections - 1) {
        nextSection = currentSection + 1;
      } else {
        // Last content section, move to quiz
        nextSection = totalSections;
        newShowQuizResults = false; // Reset quiz results when entering quiz
        newQuizAnswers = {}; // Reset quiz answers when entering quiz
        newQuizFeedback = []; // Reset quiz feedback
      }
      // Mark current content section as completed
      if (!sectionsCompleted.includes(currentSection)) {
        sectionsCompleted.push(currentSection);
      }
    } else {
      // User is in quiz section and results are shown
      if (newShowQuizResults) {
        const passedQuiz = (newQuizScore || 0) >= 70;
        if (passedQuiz) {
          // Training passed, close modal
          closeTraining();
          return; // Exit early as we're closing
        } else {
          // Quiz failed, allow retake
          newShowQuizResults = false;
          newQuizAnswers = {};
          newQuizFeedback = [];
          newQuizAttempts = (moduleProgress.quiz_attempts || 0); // Reset attempts or increment here if desired
        }
      } else {
        // Quiz not yet submitted, so this button means submit
        await handleQuizSubmit(currentTraining);
        return; // handleQuizSubmit will update state and save progress, so exit
      }
    }

    setCurrentSection(nextSection);
    setQuizAnswers(newQuizAnswers);
    setShowQuizResults(newShowQuizResults);
    setQuizFeedback(newQuizFeedback);

    await saveTrainingProgress(currentTraining.id, {
      ...moduleProgress,
      sections_completed: sectionsCompleted,
      current_section: nextSection,
      quiz_answers: newQuizAnswers,
      completed: newIsCompleted,
      quiz_score: newQuizScore,
      quiz_attempts: newQuizAttempts
    });
  }, [currentTraining, currentSection, showQuizResults, quizAnswers, quizFeedback, userProgress, handleQuizSubmit, saveTrainingProgress, closeTraining]);

  const handlePreviousSection = useCallback(() => {
    if (!currentTraining) return;

    const totalSections = currentTraining.content.sections.length;
    const isCurrentlyQuizSection = currentSection >= totalSections;

    let prevSection = currentSection;
    if (isCurrentlyQuizSection) {
      // If currently in quiz, go back to last content section
      prevSection = totalSections - 1;
      setShowQuizResults(false); // Reset quiz results if going back
      setQuizAnswers(userProgress[currentTraining.id]?.quiz_answers || {}); // Retain answers from progress if available
      setQuizFeedback([]);
    } else if (currentSection > 0) {
      // Go to previous content section
      prevSection = currentSection - 1;
    }

    setCurrentSection(prevSection);
  }, [currentTraining, currentSection, userProgress]);

  const canCompleteTraining = useCallback(() => {
    if (!currentTraining) return false;
    const progress = userProgress[currentTraining.id];
    return progress && (progress.quiz_score || 0) >= 70;
  }, [currentTraining, userProgress]);

  // Filter modules based on selected role type and company allow-list
  const generalTrainingModules = useMemo(() => {
    const enabledSet = new Set(company?.training_enabled_modules || []);
    const base = allTrainingModules.filter(module => module.target_audience === 'general');
    return enabledSet.size > 0 ? base.filter(m => enabledSet.has(m.id)) : base;
  }, [allTrainingModules, company]);

  const engineeringTrainingModules = useMemo(() => {
    const enabledSet = new Set(company?.training_enabled_modules || []);
    const base = allTrainingModules.filter(module => module.target_audience === 'engineering');
    return enabledSet.size > 0 ? base.filter(m => enabledSet.has(m.id)) : base;
  }, [allTrainingModules, company]);

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <Card className="glass-effect border-red-500/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Authentication Required</h1>
            <p className="text-gray-400 mb-6">Please log in to access security training.</p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New component for video section
  const VideoSection = memo(({ moduleId }) => {
    const [moduleVideo, setModuleVideo] = useState(null);
    const [loadingVideo, setLoadingVideo] = useState(true);

    // Load video for the module; do not include getModuleVideo in deps
    const loadModuleVideo = useCallback(async () => {
      setLoadingVideo(true);
      try {
        const video = await getModuleVideo(moduleId);
        setModuleVideo(video);
      } catch (error) {
        console.error("Error loading module video:", error);
      } finally {
        setLoadingVideo(false);
      }
    }, [moduleId]); // removed getModuleVideo from deps

    useEffect(() => {
      if (moduleId) {
        loadModuleVideo();
      }
    }, [moduleId, loadModuleVideo]); // no getModuleVideo here either

    if (loadingVideo) {
      return (
        <div className="bg-slate-800 rounded-lg p-4 mb-6 flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      );
    }

    if (moduleVideo) {
      return (
        <div className="mb-6">
          <Suspense fallback={
            <div className="bg-slate-800 rounded-lg p-8 text-center h-48 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
            </div>
          }>
            <VideoPlayer
              video={moduleVideo}
              onComplete={() => {
                // Mark video as completed in training progress if needed
                console.log("Video completed for module:", moduleId);
                // Optionally save progress here, e.g., mark a video section complete
              }}
              onProgress={(currentTime, duration) => {
                // Handle video progress updates
                // console.log(`Video progress for ${moduleId}: ${currentTime}/${duration}`);
              }}
              showTranscript={true}
              autoPlay={false}
            />
          </Suspense>
        </div>
      );
    }

    return null; // No video available for this module/role
  });

  // Enhanced quiz section component
  const QuizSection = memo(({
    quiz,
    quizAnswers,
    setQuizAnswers,
    showQuizResults,
    quizFeedback,
    onSubmitQuiz
  }) => {
    const correctCount = Object.entries(quizAnswers).filter(([qIndex, answer]) =>
      quiz[parseInt(qIndex)].correct === answer
    ).length;
    const score = Math.round((correctCount / quiz.length) * 100);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-purple-300 mb-4">Knowledge Check</h2>
          <p className="text-lg text-gray-300">Test your understanding of the material. You need 70% to pass.</p>
        </div>

        {!showQuizResults ? (
          <div className="space-y-6">
            {quiz.map((question, qIndex) => (
              <div key={qIndex} className="bg-slate-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Question {qIndex + 1}: {question.question}
                </h3>
                <div className="space-y-3">
                  {question.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className="flex items-center cursor-pointer group p-2 rounded-md hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={oIndex}
                        checked={quizAnswers[qIndex] === oIndex}
                        onChange={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                        className="mr-3 w-5 h-5 text-cyan-500 bg-slate-700 border-gray-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-gray-300 group-hover:text-white transition-colors">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center">
              <Button
                onClick={() => onSubmitQuiz(currentTraining)}
                disabled={Object.keys(quizAnswers).length < quiz.length || savingProgress}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-3 text-lg"
              >
                {savingProgress ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Enhanced Quiz Results */
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-300 mb-2">Quiz Results</h3>
              <div className="text-4xl font-bold text-white mb-2">
                {score}%
              </div>
              <p className="text-gray-300">
                {correctCount} of {quiz.length} correct
              </p>
              {score >= 70 ? (
                <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Training Completed Successfully!
                </Badge>
              ) : (
                <Badge className="mt-2 bg-red-500/20 text-red-300 border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Training Not Completed (Score below 70%)
                </Badge>
              )}
            </div>

            {/* Detailed Feedback for All Answers */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-semibold text-white">Review your answers:</h4>
              {quiz.map((question, qIndex) => {
                const isCorrect = quizAnswers[qIndex] === question.correct;
                const userAnswerIndex = quizAnswers[qIndex];

                return (
                  <div key={qIndex} className={`rounded-lg p-4 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <h5 className="font-semibold text-white mb-2 flex items-center">
                      Question {qIndex + 1}: {question.question}
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-400 ml-2" />
                      ) : (
                        <X className="w-4 h-4 text-red-400 ml-2" />
                      )}
                    </h5>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className={`p-2 rounded flex items-center ${
                            oIndex === question.correct
                              ? 'bg-green-600/30 text-green-100' // Correct answer background
                              : (oIndex === userAnswerIndex && !isCorrect)
                                ? 'bg-red-600/30 text-red-100' // User's incorrect answer background
                                : 'text-gray-300' // Other options
                          }`}
                        >
                          {oIndex === question.correct && <CheckCircle className="w-4 h-4 mr-2 text-green-400" />}
                          {oIndex === userAnswerIndex && oIndex !== question.correct && <X className="w-4 h-4 mr-2 text-red-400" />}
                          {option}
                        </div>
                      ))}
                    </div>
                    {quizFeedback[qIndex] && (
                      <div className="mt-3 p-2 bg-slate-700/50 rounded text-sm text-gray-300">
                        {quizFeedback[qIndex]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  });

  // Main render function for the training modal
  const renderTrainingModal = () => {
    if (!currentTraining) return null;

    const sections = currentTraining.content.sections;
    const quiz = currentTraining.content.quiz;
    const isQuizSection = currentSection >= sections.length;

    return (
      <Dialog open={!!currentTraining} onOpenChange={closeTraining}>
        <DialogContent className="max-w-4xl h-[90vh] bg-slate-900 border-cyan-500/30 text-white flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center text-2xl font-bold text-cyan-300">
              {currentTraining && <currentTraining.icon className="w-6 h-6 mr-3" />}
              {currentTraining.title}
            </DialogTitle>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6 flex-shrink-0">
            {currentTraining.content.sections.map((_, index) => (
              <React.Fragment key={`section-indicator-${index}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index < currentSection ? 'bg-green-500 text-white' :
                  index === currentSection ? 'bg-cyan-500 text-white' :
                  'bg-slate-700 text-gray-400'
                }`}>
                  {index < currentSection ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < currentTraining.content.sections.length - 1 && (
                  <div className={`w-12 h-0.5 ${index < currentSection ? 'bg-green-500' : 'bg-slate-700'}`} />
                )}
              </React.Fragment>
            ))}
            <div className="flex items-center">
              <div className={`w-12 h-0.5 ${currentSection >= sections.length ? 'bg-purple-500' : 'bg-slate-700'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentSection >= sections.length ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400'
              }`}>
                Q
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            {!isQuizSection ? (
              /* Training Content */
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {sections[currentSection].title}
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {sections[currentSection].content}
                  </p>
                </div>

                {/* Enhanced: Video Player Integration */}
                <VideoSection moduleId={currentTraining.id} />

                {sections[currentSection].image && (
                  <div className="flex justify-center">
                    <img
                      src={sections[currentSection].image}
                      alt={sections[currentSection].title}
                      className="rounded-lg max-w-full max-h-64 object-cover shadow-lg"
                    />
                  </div>
                )}

                {/* Examples */}
                {sections[currentSection].examples && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">Examples:</h3>
                    <div className="space-y-3">
                      {sections[currentSection].examples.map((example, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-gray-300 text-sm">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {sections[currentSection].checklist && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-300 mb-4">Key Points to Remember:</h3>
                    <div className="space-y-3">
                      {sections[currentSection].checklist.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                          <p className="text-gray-300 text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {sections[currentSection].actions && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4">Action Steps:</h3>
                    <div className="space-y-3">
                      {sections[currentSection].actions.map((action, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold mt-0.5 mr-3 flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-300 text-sm">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Quiz section
              <QuizSection
                quiz={quiz}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                showQuizResults={showQuizResults}
                quizFeedback={quizFeedback}
                onSubmitQuiz={handleQuizSubmit}
              />
            )}
          </div>

          {/* Navigation - Fixed at bottom */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
            <Button
              onClick={handlePreviousSection}
              disabled={currentSection === 0 && !isQuizSection}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                {isQuizSection ? 'Quiz' : `${currentSection + 1} of ${sections.length}`}
              </p>
              {savingProgress && (
                <p className="text-cyan-400 text-xs flex items-center justify-center mt-1">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Saving progress...
                </p>
              )}
            </div>

            <Button
              onClick={handleNextSection}
              disabled={
                savingProgress ||
                (isQuizSection && !showQuizResults && Object.keys(quizAnswers).length < quiz.length) ||
                (isQuizSection && showQuizResults && !canCompleteTraining())
              }
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isQuizSection ? (
                showQuizResults ? (
                  canCompleteTraining() ? "Complete Training" : "Retake Quiz"
                ) : "Submit Quiz"
              ) : (
                currentSection === sections.length - 1 ? "Start Quiz" : "Next"
              )}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Role Type Selector */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold cyber-text-glow mb-4">Security Training</h1>
              <p className="text-xl text-gray-300">
                Build your cybersecurity knowledge with interactive training modules designed for your role.
              </p>
            </div>

            {/* Role Type Selector - Fixed responsive layout */}
            <div className="w-full max-w-2xl mx-auto lg:mx-0">
              <Card className="glass-effect border-cyan-500/20 w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center justify-center lg:justify-start">
                    <UserCircle className="w-5 h-5 mr-2" />
                    Select Your Training Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleRoleTypeChange('general')}
                      disabled={savingRoleType}
                      variant={selectedRoleType === 'general' ? 'default' : 'outline'}
                      className={`flex-1 min-h-[48px] ${
                        selectedRoleType === 'general'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {savingRoleType ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                      <span className="whitespace-nowrap">Regular User</span>
                    </Button>
                    <Button
                      onClick={() => handleRoleTypeChange('engineering')}
                      disabled={savingRoleType}
                      variant={selectedRoleType === 'engineering' ? 'default' : 'outline'}
                      className={`flex-1 min-h-[48px] ${
                        selectedRoleType === 'engineering'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {savingRoleType ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                      <span className="whitespace-nowrap">Engineering</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW: Threat-aware banner */}
            {recentThreats.length > 0 && (
              <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-red-300 font-semibold">Active Threat Advisory</h3>
                    <p className="text-gray-300 text-sm">
                      We’ve detected recent high-severity advisories relevant to your organization. Consider taking the recommended modules below.
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                </div>
                <ul className="mt-3 list-disc list-inside text-gray-300 text-sm space-y-1">
                  {recentThreats.map((t) => (
                    <li key={t.id} className="font-medium">{t.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* NEW: Recommended For You */}
            {recommendedModules.length > 0 && (
              <div className="mt-8">
                <h2 className="text-3xl font-bold text-cyan-300 mb-6">Recommended for You</h2>
                <p className="text-gray-400 mb-8">
                  Personalized suggestions based on your latest security assessment and current threat landscape.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendedModules.map((module) => {
                    const Icon = module.icon;
                    const progress = userProgress[module.id];
                    const isCompleted = progress?.completed || false;
                    const sectionsCompletedCount = progress?.sections_completed?.length || 0;
                    const totalSections = module.content.sections.length;
                    let progressPercent = 0;
                    if (isCompleted) {
                      progressPercent = 100;
                    } else if (sectionsCompletedCount > 0) {
                      progressPercent = Math.round((sectionsCompletedCount / totalSections) * 100);
                      if (progressPercent > 100) progressPercent = 100;
                    }

                    return (
                      <Card key={module.id} className="glass-effect border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                              <Icon className="w-6 h-6 text-cyan-400" />
                            </div>
                            {isCompleted && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-white mb-2">{module.title}</CardTitle>
                          <p className="text-gray-400 text-sm mb-4">{module.description}</p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-cyan-300">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-4">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {module.duration}
                            </div>
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              {module.difficulty}
                            </div>
                            {progress?.quiz_score !== null && progress?.quiz_score !== undefined && (
                              <div className="flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                Score: {progress.quiz_score}%
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => startTraining(module)}
                            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                            disabled={savingProgress}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {isCompleted ? 'Review Training' : 'Start Training'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* General User Training Section */}
        {selectedRoleType === 'general' && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-cyan-300 mb-6">General Security Training</h2>
            <p className="text-gray-400 mb-8">
              Essential cybersecurity knowledge for all employees to protect against common threats.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generalTrainingModules.map((module) => {
                const Icon = module.icon;
                const progress = userProgress[module.id];
                const isCompleted = progress?.completed || false;
                const sectionsCompletedCount = progress?.sections_completed?.length || 0;
                const totalSections = module.content.sections.length;
                // Calculate progress based on sections AND quiz if applicable
                let progressPercent = 0;
                if (isCompleted) {
                  progressPercent = 100;
                } else if (sectionsCompletedCount > 0) {
                  progressPercent = Math.round((sectionsCompletedCount / totalSections) * 100);
                  if (progressPercent > 100) progressPercent = 100; // Cap at 100
                }


                return (
                  <Card key={module.id} className="glass-effect border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                          <Icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-white mb-2">{module.title}</CardTitle>
                      <p className="text-gray-400 text-sm mb-4">{module.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-cyan-300">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {module.duration}
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {module.difficulty}
                        </div>
                        {progress?.quiz_score !== null && progress?.quiz_score !== undefined && (
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            Score: {progress.quiz_score}%
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={() => startTraining(module)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                        disabled={savingProgress}
                      >
                        {savingProgress ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {isCompleted ? 'Review Training' : 'Start Training'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Engineering & DevOps Training Section */}
        {selectedRoleType === 'engineering' && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-purple-300 mb-6">Engineering & DevOps Training</h2>
            <p className="text-gray-400 mb-8">
              Specialized cybersecurity training for developers, engineers, and IT professionals.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {engineeringTrainingModules.map((module) => {
                const Icon = module.icon;
                const progress = userProgress[module.id];
                const isCompleted = progress?.completed || false;
                const sectionsCompletedCount = progress?.sections_completed?.length || 0;
                const totalSections = module.content.sections.length;
                let progressPercent = 0;
                if (isCompleted) {
                  progressPercent = 100;
                } else if (sectionsCompletedCount > 0) {
                  progressPercent = Math.round((sectionsCompletedCount / totalSections) * 100);
                  if (progressPercent > 100) progressPercent = 100; // Cap at 100
                }

                return (
                  <Card key={module.id} className="glass-effect border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                          <Icon className="w-6 h-6 text-purple-400" />
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-white mb-2">{module.title}</CardTitle>
                      <p className="text-gray-400 text-sm mb-4">{module.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-purple-300">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {module.duration}
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {module.difficulty}
                        </div>
                        {progress?.quiz_score !== null && progress?.quiz_score !== undefined && (
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            Score: {progress.quiz_score}%
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={() => startTraining(module)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        disabled={savingProgress}
                      >
                        {savingProgress ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {isCompleted ? 'Review Training' : 'Start Training'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW: Achievements & Progress */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-effect border-cyan-500/20 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2 !text-yellow-300" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.length === 0 ? (
                <p className="text-gray-400 text-sm">No badges yet. Complete modules with high scores to earn achievements.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {badges.map(b => (
                    <div key={b.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">{b.label}</div>
                        <Award className="w-4 h-4 text-yellow-300" />
                      </div>
                      {b.description && <div className="text-gray-400 text-xs mt-1">{b.description}</div>}
                      <div className="text-gray-500 text-xs mt-2">
                        {b.awarded_date ? new Date(b.awarded_date).toLocaleDateString() : ''}
                        {typeof b.score === 'number' ? ` • Score: ${b.score}%` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Your Training Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Modules Completed</span>
                  <span className="text-cyan-300 font-semibold">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Average Score</span>
                  <span className="text-purple-300 font-semibold">{avgScore !== null ? `${avgScore}%` : '—'}</span>
                </div>
                <div className="text-gray-400 mt-2">
                  Keep going—complete modules with 90%+ to earn Module Mastery badges. Achieve 4 modules at 80%+ to become a Security Champion.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Training Modal (Rendered by renderTrainingModal function) */}
      {renderTrainingModal()}
    </div>
  );
}
