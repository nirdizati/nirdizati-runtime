required_packages = c('pROC','ROCR','ggplot2','extrafont','fontcm')

for(pkg in required_packages){
  if(pkg %in% rownames(installed.packages()) == FALSE) {
    install.packages(pkg, repos='http://cran.us.r-project.org')
  }
}

library(pROC)
library(ROCR)
library(ggplot2)
library(extrafont)
library(fontcm)
loadfonts()
#font_install("fontcm")
#library(plotly)

files = list.files()[grep(paste("^output_(?=.*\\.csv)",sep=''), list.files(), perl=TRUE)]

for (File in files) {
  print(File)
  dat = read.csv(File)
  dat$label = ifelse(dat$label=="true",1,0)
  print(auc(dat$label, dat$predictions_true))
  
  max_prefix = max(dat$nr_prefixes)-1
  ff = as.data.frame(matrix(data = 0,nrow = max_prefix,ncol = 2))
  names(ff) = c("prefix","AUC")
  
  for (i in 1:max_prefix){
    ff$prefix[i] = i
    ff$AUC[i] = auc(dat$label[dat$nr_prefixes==i], dat$predictions_true[dat$nr_prefixes==i])
  }
  
  prefix_freq = as.data.frame(table(dat$nr_prefixes))
  names(prefix_freq) = c("prefix","prefix_freq")
  ff = merge(ff, prefix_freq)
  
  #ff = ff[ff$AUC != 0,]
  
  pdf(file=sprintf("AUC_%s.pdf",File),family="CM Roman",width=5,height=5)
  p = ggplot(ff,aes(x=prefix,y=AUC)) + geom_point()+geom_line() + theme(text = element_text(size=15)) +
    xlab("Number of events") + ylab("AUC") +
    scale_x_continuous(breaks = seq(5,20,5), labels =as.character(seq(5,20,5))) +
    theme(panel.background = element_rect(fill = 'white', colour = 'black',size=0.5)) + theme(panel.grid.major = element_line(colour = 'lightgrey', size = 0.3))
  print(p)
  dev.off()
  embed_fonts(sprintf("AUC_%s.pdf",File),outfile=sprintf("AUC_%s.pdf",File))
  
  # accuracy if threshold is p=0.5
  dat$predicted_label = ifelse(dat$predictions_true >= 0.5, 1, 0)
  tt = table(actual = dat$label, predicted = dat$predicted_label)
  print(sum(diag(tt)) / sum(tt)) # accuracy 0.728
  
  # let's see how accuracy depends on the probability threshold
  pred = prediction(dat$predictions_true, dat$label)
  accuracy = performance(pred, measure = "acc") # get accuracy 
  plot(accuracy, main=File) # how accuracy depends on the probability cutoff to separate class1 from class2
  accuracy@y.values[[1]][max(which(accuracy@x.values[[1]] >= 0.5))] # accuracy when cutoff=0.5
  
  #df = data.frame(X = accuracy@x.values[[1]], Y = accuracy@y.values[[1]])
  #p2 = ggplot(df,aes(x = X, y= Y)) + geom_point(size = 0.2) + geom_point(size = 0.2) +
    #xlab("Cutoff (Pr)") + ylab("Accuracy")
  #ggplotly(p2)
  #chart_link = plotly_POST(p2, filename="auc_bpic17")
}


