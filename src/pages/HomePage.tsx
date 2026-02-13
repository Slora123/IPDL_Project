import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Wallet, 
  ArrowRight, 
  Globe, 
  BarChart3, 
  Shield, 
  Smartphone,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Mic,
      title: "Voice-Enabled Recording",
      titleHindi: "आवाज़ से रिकॉर्डिंग",
      description: "Record transactions by speaking in Hindi, Marathi, or English",
      descriptionHindi: "हिंदी, मराठी या अंग्रेजी में बोलकर लेन-देन रिकॉर्ड करें",
      color: "text-primary"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      titleHindi: "स्मार्ट एनालिटिक्स",
      description: "Get instant insights into your business performance",
      descriptionHindi: "अपने व्यापार के प्रदर्शन की तुरंत जानकारी पाएं",
      color: "text-success"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      titleHindi: "बहुभाषी समर्थन",
      description: "Works seamlessly in multiple Indian languages",
      descriptionHindi: "कई भारतीय भाषाओं में निर्बाध रूप से काम करता है",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      titleHindi: "सुरक्षित और निजी",
      description: "Your business data is encrypted and secure",
      descriptionHindi: "आपका व्यापारिक डेटा एन्क्रिप्टेड और सुरक्षित है",
      color: "text-info"
    }
  ];

  const testimonials = [
    {
      name: "राम शर्मा",
      business: "Grocery Store Owner",
      rating: 5,
      comment: "VoicePay ने मेरे व्यापार को बहुत आसान बना दिया है। अब मैं हिंदी में बोलकर सब कुछ रिकॉर्ड कर सकता हूं।",
      commentEn: "VoicePay has made my business so much easier. Now I can record everything by speaking in Hindi."
    },
    {
      name: "Priya Patel",
      business: "Tea Stall Owner",
      rating: 5,
      comment: "The voice recognition is amazing! It understands my Gujarati-Hindi mix perfectly.",
      commentHi: "वॉयस रिकग्निशन बहुत बेहतरीन है! यह मेरी गुजराती-हिंदी मिश्रण को बिल्कुल सही समझता है।"
    },
    {
      name: "अजय महाजन",
      business: "Mobile Shop",
      rating: 5,
      comment: "पहले मुझे हिसाब-किताब रखना मुश्किल लगता था। अब VoicePay के साथ सब कुछ automatic है।",
      commentEn: "Earlier I found it difficult to keep accounts. Now with VoicePay everything is automatic."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users", labelHindi: "सक्रिय उपयोगकर्ता" },
    { number: "94%", label: "Voice Accuracy", labelHindi: "आवाज़ की सटीकता" },
    { number: "15+", label: "Languages", labelHindi: "भाषाएं" },
    { number: "₹50L+", label: "Transactions Tracked", labelHindi: "ट्रैक किए गए लेन-देन" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                VoicePay
              </h1>
              <p className="text-xs text-muted-foreground">Smart Business Tracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/login')} className="bg-gradient-primary">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
              🎉 Now supporting 15+ Indian languages
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Voice-Enabled Business
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Expense Tracking
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Record transactions by voice in Hindi, Marathi, or English. Get instant financial insights for your small business.
            </p>
            <p className="text-lg text-muted-foreground">
              "50 रुपये दूध खरीदी" → Instant expense tracking
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-gradient-primary text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground italic">{stat.labelHindi}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Powerful Features for Small Businesses
            </h2>
            <p className="text-xl text-muted-foreground">
              छोटे व्यापार के लिए शक्तिशाली सुविधाएं
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`shadow-card hover:shadow-lg transition-all cursor-pointer group ${
                  activeFeature === index ? 'ring-2 ring-primary' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`h-16 w-16 rounded-full bg-background flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{feature.titleHindi}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <p className="text-xs text-muted-foreground italic mt-1">{feature.descriptionHindi}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground">
              हमारे उपयोगकर्ता क्या कहते हैं
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 italic">"{testimonial.comment}"</p>
                  {testimonial.commentEn && (
                    <p className="text-xs text-muted-foreground mb-4">"{testimonial.commentEn}"</p>
                  )}
                  {testimonial.commentHi && (
                    <p className="text-xs text-muted-foreground mb-4">"{testimonial.commentHi}"</p>
                  )}
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary text-white">
        <div className="container mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl opacity-90">
            अपने व्यापार को बदलने के लिए तैयार हैं?
          </p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Join thousands of small business owners who are already using VoicePay to streamline their financial management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="text-lg px-8 py-6"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">VoicePay</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Voice-enabled business expense tracking for Indian small businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
                <li>Integrations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Status</li>
                <li>Community</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 VoicePay. All rights reserved. Made with ❤️ for Indian businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}