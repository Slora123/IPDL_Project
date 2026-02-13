import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  BookOpen, 
  Video, 
  HelpCircle,
  ExternalLink,
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const { toast } = useToast();

  const faqData = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I record my first transaction using voice?",
          questionHindi: "वॉयस का उपयोग करके मैं अपना पहला लेन-देन कैसे रिकॉर्ड करूं?",
          answer: "Tap the floating microphone button and speak clearly: '50 रुपये दूध खरीदी' or 'Sold snacks for 100 rupees'. The system will automatically detect the language and record the transaction.",
          answerHindi: "फ्लोटिंग माइक्रोफोन बटन पर टैप करें और स्पष्ट रूप से बोलें: '50 रुपये दूध खरीदी' या 'Sold snacks for 100 rupees'। सिस्टम स्वचालित रूप से भाषा का पता लगाएगा और लेन-देन रिकॉर्ड करेगा।"
        },
        {
          question: "Which languages are supported for voice commands?",
          questionHindi: "वॉयस कमांड के लिए कौन सी भाषाएं समर्थित हैं?",
          answer: "VoicePay supports Hindi, Marathi, and English. You can mix languages in a single command, and the AI will understand the context.",
          answerHindi: "VoicePay हिंदी, मराठी और अंग्रेजी का समर्थन करता है। आप एक ही कमांड में भाषाओं को मिला सकते हैं, और AI संदर्भ को समझ जाएगा।"
        },
        {
          question: "How accurate is the voice recognition?",
          questionHindi: "वॉयस रिकग्निशन कितना सटीक है?",
          answer: "Our voice recognition achieves 94% accuracy with continuous learning from your usage patterns. The more you use it, the better it gets at understanding your voice.",
          answerHindi: "हमारी वॉयस रिकग्निशन आपके उपयोग पैटर्न से निरंतर सीखने के साथ 94% सटीकता प्राप्त करती है। जितना अधिक आप इसका उपयोग करेंगे, यह आपकी आवाज़ को समझने में उतना बेहतर होता जाएगा।"
        }
      ]
    },
    {
      category: "Financial Management",
      questions: [
        {
          question: "How do I understand my profit and loss calculations?",
          questionHindi: "मैं अपने लाभ और हानि की गणना को कैसे समझूं?",
          answer: "Go to Analytics → Revenue Analysis to see detailed profit margins. Green indicates profit, red shows losses. The dashboard automatically calculates profit by subtracting expenses from income.",
          answerHindi: "विस्तृत लाभ मार्जिन देखने के लिए Analytics → Revenue Analysis पर जाएं। हरा लाभ दर्शाता है, लाल हानि दिखाता है। डैशबोर्ड आय से व्यय घटाकर स्वचालित रूप से लाभ की गणना करता है।"
        },
        {
          question: "Can I generate reports for tax purposes?",
          questionHindi: "क्या मैं कर उद्देश्यों के लिए रिपोर्ट तैयार कर सकता हूँ?",
          answer: "Yes! Go to Reports section and select 'Tax Reports'. You can generate GST-ready reports and income summaries that are accepted by tax authorities.",
          answerHindi: "हाँ! Reports सेक्शन में जाएं और 'Tax Reports' चुनें। आप GST-ready रिपोर्ट और आय सारांश तैयार कर सकते हैं जो कर अधिकारियों द्वारा स्वीकार किए जाते हैं।"
        },
        {
          question: "How do I set up different business categories?",
          questionHindi: "मैं अलग-अलग व्यापार श्रेणियां कैसे सेट करूं?",
          answer: "Categories are automatically detected from your voice commands. For custom categories, go to Settings → Categories and add your specific business types like 'Dairy', 'Groceries', etc.",
          answerHindi: "श्रेणियां आपके वॉयस कमांड से स्वचालित रूप से पहचानी जाती हैं। कस्टम श्रेणियों के लिए, Settings → Categories में जाएं और अपने विशिष्ट व्यापार प्रकार जैसे 'डेयरी', 'किराना' आदि जोड़ें।"
        }
      ]
    },
    {
      category: "Technical Issues",
      questions: [
        {
          question: "What should I do if voice recognition is not working?",
          questionHindi: "यदि वॉयस रिकग्निशन काम नहीं कर रहा है तो मुझे क्या करना चाहिए?",
          answer: "1. Check your microphone permissions 2. Ensure stable internet connection 3. Go to Settings → Voice → Recalibrate Voice Recognition 4. Speak clearly and avoid background noise",
          answerHindi: "1. अपनी माइक्रोफोन अनुमतियां जांचें 2. स्थिर इंटरनेट कनेक्शन सुनिश्चित करें 3. Settings → Voice → Recalibrate Voice Recognition पर जाएं 4. स्पष्ट रूप से बोलें और पृष्ठभूमि शोर से बचें"
        },
        {
          question: "How do I backup my data?",
          questionHindi: "मैं अपने डेटा का बैकअप कैसे करूं?",
          answer: "Go to Settings → Data → Export Data. Your transactions and reports will be downloaded as a secure backup file. Enable cloud sync for automatic backups.",
          answerHindi: "Settings → Data → Export Data पर जाएं। आपके लेन-देन और रिपोर्ट एक सुरक्षित बैकअप फ़ाइल के रूप में डाउनलोड हो जाएंगे। स्वचालित बैकअप के लिए cloud sync सक्षम करें।"
        }
      ]
    }
  ];

  const contactOptions = [
    {
      title: "Live Chat Support",
      titleHindi: "लाइव चैट सपोर्ट",
      description: "Get instant help from our support team",
      descriptionHindi: "हमारी सपोर्ट टीम से तत्काल सहायता प्राप्त करें",
      icon: MessageCircle,
      action: "Start Chat",
      available: "24/7 Available",
      color: "bg-primary/10 text-primary border-primary/20"
    },
    {
      title: "Phone Support",
      titleHindi: "फोन सपोर्ट",
      description: "Speak directly with our Hindi/English support",
      descriptionHindi: "हमारे हिंदी/अंग्रेजी सपोर्ट से सीधे बात करें",
      icon: Phone,
      action: "Call Now",
      available: "Mon-Sat 9AM-8PM",
      color: "bg-success/10 text-success border-success/20"
    },
    {
      title: "Email Support",
      titleHindi: "ईमेल सपोर्ट",
      description: "Detailed help via email in your preferred language",
      descriptionHindi: "आपकी पसंदीदा भाषा में ईमेल के माध्यम से विस्तृत सहायता",
      icon: Mail,
      action: "Send Email",
      available: "Response in 24 hours",
      color: "bg-warning/10 text-warning border-warning/20"
    }
  ];

  const tutorials = [
    {
      title: "Complete Setup Guide",
      titleHindi: "संपूर्ण सेटअप गाइड",
      duration: "15 mins",
      type: "Video",
      level: "Beginner"
    },
    {
      title: "Advanced Voice Commands",
      titleHindi: "एडवांस्ड वॉयस कमांड",
      duration: "8 mins", 
      type: "Video",
      level: "Intermediate"
    },
    {
      title: "Reading Financial Reports",
      titleHindi: "वित्तीय रिपोर्ट पढ़ना",
      duration: "12 mins",
      type: "Video", 
      level: "Beginner"
    },
    {
      title: "Tax Report Generation",
      titleHindi: "टैक्स रिपोर्ट जेनेरेशन",
      duration: "10 mins",
      type: "Guide",
      level: "Advanced"
    }
  ];

  const handleSupportSubmit = () => {
    toast({
      title: "Support Request Sent",
      description: "We'll get back to you within 24 hours with a solution.",
    });
    setSupportMessage("");
  };

  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.questionHindi.includes(searchTerm)
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground">
            सहायता और समर्थन - Get help with VoicePay features and troubleshooting
          </p>
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          {/* Search Bar */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs... / FAQ खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {filteredFAQs.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                        <AccordionTrigger className="text-left">
                          <div>
                            <div className="font-medium">{item.question}</div>
                            <div className="text-sm text-muted-foreground mt-1">{item.questionHindi}</div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            <p className="text-foreground">{item.answer}</p>
                            <p className="text-muted-foreground italic">{item.answerHindi}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactOptions.map((option, index) => (
              <Card key={index} className={`shadow-card border-2 ${option.color} cursor-pointer hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6 text-center">
                  <option.icon className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{option.titleHindi}</p>
                  <p className="text-sm mb-3">{option.description}</p>
                  <p className="text-sm italic mb-4">{option.descriptionHindi}</p>
                  <Badge variant="secondary" className="mb-3">{option.available}</Badge>
                  <Button className="w-full" size="sm">
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>हमें एक संदेश भेजें - Describe your issue in detail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name / नाम</label>
                  <Input id="name" placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email / ईमेल</label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Subject / विषय</label>
                <Input id="subject" placeholder="Brief description of your issue" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Message / संदेश</label>
                <Textarea 
                  id="message"
                  placeholder="Describe your issue in detail... / अपनी समस्या का विस्तार से वर्णन करें..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleSupportSubmit} className="bg-gradient-primary">
                <Send className="mr-2 h-4 w-4" />
                Send Message / संदेश भेजें
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorials.map((tutorial, index) => (
              <Card key={index} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{tutorial.titleHindi}</p>
                    </div>
                    <Badge variant="outline">{tutorial.level}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      {tutorial.type === "Video" ? <Video className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                      {tutorial.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {tutorial.duration}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {tutorial.type === "Video" ? "Watch Tutorial" : "Read Guide"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-medium">Voice Recognition</h3>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-success ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-medium">Data Sync</h3>
                    <p className="text-sm text-muted-foreground">Cloud backup active</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-success ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-warning rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-medium">Analytics Processing</h3>
                    <p className="text-sm text-muted-foreground">Minor delays expected</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-warning ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium">Voice accuracy improved to 94%</p>
                    <p className="text-sm text-muted-foreground">Enhanced Marathi language support - 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-info mt-0.5" />
                  <div>
                    <p className="font-medium">New report templates added</p>
                    <p className="text-sm text-muted-foreground">GST-ready formats now available - 1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}