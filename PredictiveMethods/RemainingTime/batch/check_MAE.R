required_packages = c('reshape','ggplot2','extrafont','fontcm')

for(pkg in required_packages){
  if(pkg %in% rownames(installed.packages()) == FALSE) {
    install.packages(pkg, repos='http://cran.us.r-project.org')
  }
}

library(reshape)
library(ggplot2)
library(extrafont)
library(fontcm)
loadfonts()
#font_install("fontcm")
#library(plotly)

dat_train = read.csv("../../data/train_bpi12.csv")
files = list.files()[grep(paste("^output_bpi12(?=.*\\.csv)",sep=''), list.files(), perl=TRUE)]

for (File in files) { 
  print(File)
  dat = read.csv(File)
  dat$abserr = abs(dat$ground_truth - dat$predictions_true)
  print(mean(dat$abserr)) # average MAE across all prefix sizes
  
  # how much is our model better than mean model
  dat$mean_remtime = 0
  for (i in 1:length(unique(dat$nr_prefixes))){
    dat$mean_remtime[dat$nr_prefixes == i] = mean(dat_train$remtime[dat_train$event_nr==i])
  }
  dat$abserr_mean = abs(dat$ground_truth - dat$mean_remtime)
  
  #print(mean(dat$abserr_mean))
  
  max_prefix = max(dat$nr_prefixes)-1
  ff = as.data.frame(matrix(data = 0,nrow = max_prefix,ncol = 3))
  colnames(ff) = c("prefix","our_method","MAE_mean")
  
  for (i in 1:max_prefix){
    #cat(i," ", mean(dat$abserr[dat$nr_prefixes==i]), "\n")
    ff$prefix[i] = i
    ff$our_method[i] = mean(dat$abserr[dat$nr_prefixes==i])
    ff$MAE_mean[i] = mean(dat$abserr_mean[dat$nr_prefixes==i])
  }
  
  ff = melt(ff,id.vars = "prefix")
  
  require(grid)
  pdf(file=sprintf("MAE_%s.pdf",File),family="CM Roman",width=5,height=5)
  p = ggplot(ff,aes(x=prefix,y=value/86400,color=variable)) + geom_point()+geom_line(aes(linetype=variable),size=0.7) + 
    theme(text = element_text(size=15)) +
    xlab("Number of events") + ylab("MAE, days") +
    scale_x_continuous(breaks = seq(5,20,5), labels =as.character(seq(5,20,5))) +
    theme(panel.background = element_rect(fill = 'white', colour = 'black',size=0.5)) + theme(panel.grid.major = element_line(colour = 'lightgrey', size = 0.3)) +
    theme(legend.title=element_blank()) + theme(legend.justification=c(0.05,0.05), legend.position=c(0.05,0.05)) +
    theme(legend.key.width = unit(2.5, "line"))+
    theme(legend.background = element_rect(colour = 'white',size = 0.1, linetype='solid'))
  print(p)
  dev.off()
  embed_fonts(sprintf("MAE_%s.pdf",File),outfile=sprintf("MAE_%s.pdf",File))
  
  #ggplotly(p1)
  #chart_link = plotly_POST(p1, filename="MAE_bpic17")
  
}
